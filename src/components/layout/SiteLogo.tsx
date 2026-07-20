import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { siteConfig } from "@/config/site";

export function SiteLogo({ locale }: { locale: Locale }) {
  return (
    <Link
      href={getPath(locale, "home")}
      className="focus-ring inline-flex min-h-12 items-center gap-3 rounded-full"
    >
      <span
        className="site-mark grid h-11 w-11 place-items-center rounded-full bg-blue-strong text-white shadow-soft"
        aria-hidden="true"
      >
        <span className="h-5 w-5 rounded-[6px] border-4 border-yellow bg-transparent" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold text-blue-strong sm:text-base">
          {siteConfig.shortName[locale]}
        </span>
        <span className="hidden text-xs text-ink-muted sm:block">
          {locale === "uk"
            ? "Спільнота у Німеччині"
            : "Gemeinschaft in Deutschland"}
        </span>
      </span>
    </Link>
  );
}
