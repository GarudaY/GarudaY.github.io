import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import {
  getCourses,
  getEvents,
  getNewsArticles,
  getPeople,
} from "@/data/content";
import { locales } from "@/i18n/config";
import { getPath, type RouteKey } from "@/i18n/routing";

export const dynamic = "force-static";

const staticRoutes: RouteKey[] = [
  "home",
  "about",
  "courses",
  "events",
  "news",
  "donate",
  "contact",
];

function url(path: string) {
  return new URL(path, siteConfig.baseUrl).toString();
}

function languageAlternates(route: RouteKey, slug?: string) {
  return {
    languages: Object.fromEntries(
      locales.map((locale) => [locale, url(getPath(locale, route, slug))]),
    ),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, events, news, people] = await Promise.all([
    getCourses(),
    getEvents(),
    getNewsArticles(),
    getPeople(),
  ]);
  const now = new Date();

  const staticEntries = locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: url(getPath(locale, route)),
      lastModified: now,
      changeFrequency:
        route === "home" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "home" ? 1 : 0.7,
      alternates: languageAlternates(route),
    })),
  );

  const courseEntries = locales.flatMap((locale) =>
    courses.map((course) => ({
      url: url(getPath(locale, "courses", course.slug)),
      lastModified: new Date(course.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: languageAlternates("courses", course.slug),
    })),
  );

  const eventEntries = locales.flatMap((locale) =>
    events.map((event) => ({
      url: url(getPath(locale, "events", event.slug)),
      lastModified: new Date(event.updatedAt),
      changeFrequency: "weekly" as const,
      priority: event.eventStatus === "upcoming" ? 0.85 : 0.45,
      alternates: languageAlternates("events", event.slug),
    })),
  );

  const newsEntries = locales.flatMap((locale) =>
    news.map((article) => ({
      url: url(getPath(locale, "news", article.slug)),
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.65,
      alternates: languageAlternates("news", article.slug),
    })),
  );

  const peopleEntries = locales.flatMap((locale) =>
    people
      .filter((person) => !person.isDemo && !person.seo.noIndex)
      .map((person) => ({
        url: url(getPath(locale, "people", person.slug)),
        lastModified: new Date(person.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.35,
        alternates: languageAlternates("people", person.slug),
      })),
  );

  return [
    ...staticEntries,
    ...courseEntries,
    ...eventEntries,
    ...newsEntries,
    ...peopleEntries,
  ];
}
