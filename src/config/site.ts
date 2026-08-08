import type { Locale } from "@/i18n/config";

export const siteConfig = {
  defaultLocale: "uk" satisfies Locale,
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://garuday.github.io",
  timeZone: "Europe/Berlin",
  organizationId: "sonnenblume-ukraine-community-mg",
  organizationName: {
    uk: "SONNENBLUME — Interkultureller Verein e.V.",
    de: "SONNENBLUME — Interkultureller Verein e.V.",
  },
  shortName: {
    uk: "SONNENBLUME",
    de: "SONNENBLUME",
  },
} as const;
