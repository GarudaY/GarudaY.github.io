import { cache } from "react";
import { connection } from "next/server";
import { events } from "@/content/mock/events";
import { parseCmsEvents } from "@/lib/cms-events";
import { wordpressNewsEndpoint } from "@/lib/verein-updates";
import snapshot from "@/content/cms-static-snapshot.json";

async function loadPublishedEvents(buildOnly: boolean) {
  const isExport = process.env.GITHUB_PAGES_EXPORT === "true";
  if (!buildOnly && !isExport) await connection();
  const base = process.env.WORDPRESS_CMS_URL;
  if (!base)
    return events
      .filter((event) => event.status === "published")
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  const endpoint = wordpressNewsEndpoint(
    base,
    process.env.NODE_ENV === "development",
  );
  endpoint.searchParams.set("rest_route", "/sonnenblume/v1/events/public");
  if (isExport) {
    if (
      snapshot.origin !== endpoint.origin + endpoint.pathname ||
      snapshot.events === null
    )
      throw new Error(
        "A matching published CMS snapshot is required for Pages export",
      );
    return parseCmsEvents(snapshot.events, endpoint);
  }
  const response = await fetch(endpoint, {
    ...(process.env.NODE_ENV === "development"
      ? { cache: "no-store" as const }
      : buildOnly
        ? { cache: "force-cache" as const }
        : { next: { revalidate: 60 } }),
    signal: AbortSignal.timeout(5000),
    redirect: "error",
    headers: { Accept: "application/json" },
  });
  if (
    !response.ok ||
    Number(response.headers.get("content-length")) > 2_000_000
  )
    throw new Error(
      "Published CMS events unavailable; refusing to restore withdrawn events",
    );
  const text = await response.text();
  if (text.length > 2_000_000) throw new Error("CMS events response too large");
  return parseCmsEvents(JSON.parse(text), endpoint);
}

export const getPublishedEvents = cache(() => loadPublishedEvents(false));
export const getEventsForBuild = () => loadPublishedEvents(true);
