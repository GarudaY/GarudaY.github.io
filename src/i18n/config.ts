export const locales = ["uk", "de"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uk";

export const localeLabels: Record<Locale, string> = {
  uk: "Українська",
  de: "Deutsch",
};

export function isLocale(value: string | undefined): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}
