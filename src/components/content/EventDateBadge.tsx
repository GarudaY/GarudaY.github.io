import type { Locale } from "@/i18n/config";
import { formatDate } from "@/lib/localize";
import { siteConfig } from "@/config/site";

export function EventDateBadge({
  date,
  locale,
}: {
  date: string;
  locale: Locale;
}) {
  const parsed = new Date(date);
  const day = new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "de-DE", {
    day: "2-digit",
    timeZone: siteConfig.timeZone,
  }).format(parsed);
  const month = new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "de-DE", {
    month: "short",
    timeZone: siteConfig.timeZone,
  }).format(parsed);

  return (
    <div className="grid h-18 w-18 shrink-0 place-items-center rounded-[14px] bg-blue-strong px-2 py-2 text-center text-white shadow-sm">
      <span aria-hidden="true" className="text-2xl font-bold leading-none">
        {day}
      </span>
      <span aria-hidden="true" className="text-xs font-semibold uppercase">
        {month}
      </span>
      <span className="sr-only">{formatDate(date, locale)}</span>
    </div>
  );
}
