import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/config";

export type RouteKey =
  | "home"
  | "about"
  | "courses"
  | "people"
  | "events"
  | "news"
  | "donate"
  | "contact"
  | "impressum"
  | "privacy"
  | "cookies";

export const localizedSegments: Record<RouteKey, Record<Locale, string>> = {
  home: { uk: "", de: "" },
  about: { uk: "about", de: "ueber-uns" },
  courses: { uk: "courses", de: "kurse" },
  people: { uk: "people", de: "menschen" },
  events: { uk: "events", de: "veranstaltungen" },
  news: { uk: "news", de: "neuigkeiten" },
  donate: { uk: "donate", de: "spenden" },
  contact: { uk: "contact", de: "kontakt" },
  impressum: { uk: "impressum", de: "impressum" },
  privacy: { uk: "privacy", de: "datenschutz" },
  cookies: { uk: "cookies", de: "cookie-einstellungen" },
};

export const internalSegments: Record<Exclude<RouteKey, "home">, string> = {
  about: "about",
  courses: "courses",
  people: "people",
  events: "events",
  news: "news",
  donate: "donate",
  contact: "contact",
  impressum: "impressum",
  privacy: "privacy",
  cookies: "cookies",
};

export const publicToInternalSegment: Record<Locale, Record<string, string>> = {
  uk: Object.fromEntries(
    Object.entries(localizedSegments)
      .filter(([key]) => key !== "home")
      .map(([key, value]) => [
        value.uk,
        internalSegments[key as Exclude<RouteKey, "home">],
      ]),
  ),
  de: Object.fromEntries(
    Object.entries(localizedSegments)
      .filter(([key]) => key !== "home")
      .map(([key, value]) => [
        value.de,
        internalSegments[key as Exclude<RouteKey, "home">],
      ]),
  ),
};

export const internalToPublicSegment: Record<Locale, Record<string, string>> = {
  uk: Object.fromEntries(
    Object.entries(internalSegments).map(([key, value]) => [
      value,
      localizedSegments[key as Exclude<RouteKey, "home">].uk,
    ]),
  ),
  de: Object.fromEntries(
    Object.entries(internalSegments).map(([key, value]) => [
      value,
      localizedSegments[key as Exclude<RouteKey, "home">].de,
    ]),
  ),
};

export function getPath(locale: Locale, route: RouteKey, slug?: string) {
  const segment = localizedSegments[route][locale];
  const parts = [locale, segment, slug].filter(Boolean);
  return `/${parts.join("/")}`;
}

export function getCanonicalUrl(
  locale: Locale,
  route: RouteKey,
  slug?: string,
) {
  return new URL(getPath(locale, route, slug), siteConfig.baseUrl).toString();
}

export function getAlternateLanguages(route: RouteKey, slug?: string) {
  return {
    uk: getCanonicalUrl("uk", route, slug),
    de: getCanonicalUrl("de", route, slug),
    "x-default": getCanonicalUrl(siteConfig.defaultLocale, route, slug),
  };
}
