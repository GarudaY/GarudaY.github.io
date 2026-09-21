import { cache } from "react";
import { connection } from "next/server";
import { partners } from "@/content/mock/partners";
import { parseCmsPartners } from "@/lib/cms-partners";
import { wordpressNewsEndpoint } from "@/lib/verein-updates";
import snapshot from "@/content/cms-static-snapshot.json";

async function loadPublishedPartners() {
  const isExport = process.env.GITHUB_PAGES_EXPORT === "true";
  if (!isExport) await connection();
  const fallback = () => partners.filter((item) => item.status === "published").sort((a, b) => a.order - b.order);
  const base = process.env.WORDPRESS_CMS_URL;
  if (!base) return fallback();
  const endpoint = wordpressNewsEndpoint(base, process.env.NODE_ENV === "development");
  endpoint.searchParams.set("rest_route", "/sonnenblume/v1/partners/public");
  if (isExport) {
    if (snapshot.origin !== endpoint.origin + endpoint.pathname || snapshot.partners === null)
      throw new Error("A matching published partner snapshot is required for Pages export");
    const feed = parseCmsPartners(snapshot.partners, endpoint);
    return feed.initialized ? feed.items : fallback();
  }
  const response = await fetch(endpoint, {
    ...(process.env.NODE_ENV === "development" ? { cache: "no-store" as const } : { next: { revalidate: 60 } }),
    signal: AbortSignal.timeout(5000), redirect: "error", headers: { Accept: "application/json" },
  });
  if (!response.ok || Number(response.headers.get("content-length")) > 1_000_000)
    throw new Error("Published CMS partners unavailable; refusing to restore withdrawn entries");
  const body = await response.text();
  if (body.length > 1_000_000) throw new Error("CMS partner response too large");
  const feed = parseCmsPartners(JSON.parse(body), endpoint);
  return feed.initialized ? feed.items : fallback();
}

export const getPublishedPartners = cache(loadPublishedPartners);
