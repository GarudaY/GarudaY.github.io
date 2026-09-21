import { cache } from "react";
import { connection } from "next/server";
import { volunteerOpportunities } from "@/content/mock/volunteer-opportunities";
import { parseCmsVolunteer } from "@/lib/cms-volunteer";
import { wordpressNewsEndpoint } from "@/lib/verein-updates";
import snapshot from "@/content/cms-static-snapshot.json";

async function loadPublishedVolunteer() {
  const isExport = process.env.GITHUB_PAGES_EXPORT === "true";
  if (!isExport) await connection();
  const base = process.env.WORDPRESS_CMS_URL;
  if (!base) return [...volunteerOpportunities].sort((a, b) => a.order - b.order);
  const endpoint = wordpressNewsEndpoint(
    base,
    process.env.NODE_ENV === "development",
  );
  endpoint.searchParams.set("rest_route", "/sonnenblume/v1/volunteer/public");
  if (isExport) {
    if (
      snapshot.origin !== endpoint.origin + endpoint.pathname ||
      snapshot.volunteer === null
    )
      throw new Error(
        "A matching published CMS snapshot is required for Pages export",
      );
    return parseCmsVolunteer(snapshot.volunteer);
  }
  const response = await fetch(endpoint, {
    ...(process.env.NODE_ENV === "development"
      ? { cache: "no-store" as const }
      : { next: { revalidate: 60 } }),
    signal: AbortSignal.timeout(5000),
    redirect: "error",
    headers: { Accept: "application/json" },
  });
  if (
    !response.ok ||
    Number(response.headers.get("content-length")) > 1_000_000
  )
    throw new Error(
      "Published CMS volunteer tasks unavailable; refusing to restore withdrawn tasks",
    );
  const text = await response.text();
  if (text.length > 1_000_000)
    throw new Error("CMS volunteer tasks response too large");
  return parseCmsVolunteer(JSON.parse(text));
}

export const getPublishedVolunteer = cache(loadPublishedVolunteer);
