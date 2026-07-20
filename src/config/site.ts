import type { Locale } from "@/i18n/config";

export const siteConfig = {
  defaultLocale: "uk" satisfies Locale,
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example-verein.de",
  baseUrlNote: "Replace https://example-verein.de before production.",
  timeZone: "Europe/Berlin",
  organizationId: "demo-ukrainian-verein",
  organizationName: {
    uk: "Український Verein у Німеччині",
    de: "Ukrainischer Verein in Deutschland",
  },
  shortName: {
    uk: "Український Verein",
    de: "Ukrainischer Verein",
  },
  demoNotice: {
    uk: "Демонстраційний прототип. Контент, адреси та реквізити є вигаданими.",
    de: "Demo-Prototyp. Inhalte, Adressen und Zahlungsdaten sind Platzhalter.",
  },
} as const;
