import { cache } from "react";
import { connection } from "next/server";
import { courses } from "@/content/mock/courses";
import { parseCmsCourses } from "@/lib/cms-courses";
import { wordpressNewsEndpoint } from "@/lib/verein-updates";
import snapshot from "@/content/cms-static-snapshot.json";

async function loadPublishedCourses(buildOnly: boolean) {
  const isExport = process.env.GITHUB_PAGES_EXPORT === "true";
  if (!buildOnly && !isExport) await connection();
  const base = process.env.WORDPRESS_CMS_URL;
  if (!base)
    return courses
      .filter((course) => course.status === "published")
      .sort((a, b) => a.order - b.order);
  const endpoint = wordpressNewsEndpoint(
    base,
    process.env.NODE_ENV === "development",
  );
  endpoint.searchParams.set("rest_route", "/sonnenblume/v1/courses/public");
  if (isExport) {
    if (
      snapshot.origin !== endpoint.origin + endpoint.pathname ||
      snapshot.courses === null
    )
      throw new Error(
        "A matching published CMS snapshot is required for Pages export",
      );
    return parseCmsCourses(snapshot.courses, endpoint);
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
      "Published CMS courses unavailable; refusing to restore withdrawn courses",
    );
  const text = await response.text();
  if (text.length > 2_000_000)
    throw new Error("CMS courses response too large");
  return parseCmsCourses(JSON.parse(text), endpoint);
}

export const getPublishedCourses = cache(() => loadPublishedCourses(false));
export const getCoursesForBuild = () => loadPublishedCourses(true);
