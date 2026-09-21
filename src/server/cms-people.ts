import { cache } from "react";
import { connection } from "next/server";
import { people } from "@/content/mock/people";
import { parseCmsPeople } from "@/lib/cms-people";
import { wordpressNewsEndpoint } from "@/lib/verein-updates";
import snapshot from "@/content/cms-static-snapshot.json";

async function loadPublishedPeople(buildOnly: boolean) {
  const isExport = process.env.GITHUB_PAGES_EXPORT === "true";
  if (!buildOnly && !isExport) await connection();
  const base = process.env.WORDPRESS_CMS_URL;
  if (!base)
    return people
      .filter((person) => person.status === "published")
      .sort((a, b) => a.order - b.order);
  const endpoint = wordpressNewsEndpoint(
    base,
    process.env.NODE_ENV === "development",
  );
  endpoint.searchParams.set("rest_route", "/sonnenblume/v1/people/public");
  if (isExport) {
    if (
      snapshot.origin !== endpoint.origin + endpoint.pathname ||
      snapshot.people === null
    )
      throw new Error(
        "A matching published CMS snapshot is required for Pages export",
      );
    return parseCmsPeople(snapshot.people, endpoint);
  }
  const response = await fetch(endpoint, {
    ...(process.env.NODE_ENV === "development"
      ? { cache: "no-store" as const }
      : isExport || buildOnly
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
      "Published CMS profiles unavailable; refusing to restore withdrawn profiles from local source",
    );
  const text = await response.text();
  if (text.length > 2_000_000)
    throw new Error("CMS profiles response too large");
  // Empty really means empty. Privacy withdrawals must not be undone by an old fallback.
  return parseCmsPeople(JSON.parse(text), endpoint);
}

export const getPublishedPeople = cache(() => loadPublishedPeople(false));
export const getPeopleForBuild = () => loadPublishedPeople(true);
