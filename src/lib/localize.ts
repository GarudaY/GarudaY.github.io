import type { Locale } from "@/i18n/config";
import type { LocalizedList, LocalizedString } from "@/types/content";
import { siteConfig } from "@/config/site";

export function t(value: LocalizedString, locale: Locale): string {
  return value[locale] ?? value.uk;
}

export function tList(value: LocalizedList, locale: Locale): string[] {
  return value[locale] ?? value.uk;
}

export function formatDate(
  value: string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: siteConfig.timeZone,
    ...options,
  }).format(new Date(value));
}

export function formatTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: siteConfig.timeZone,
  }).format(new Date(value));
}
