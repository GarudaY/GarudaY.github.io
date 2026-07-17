"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/config";
import {
  localizedSegments,
  publicToInternalSegment,
  type RouteKey,
} from "@/i18n/routing";
import { cn } from "@/lib/cn";

function getLocalizedPath(
  locale: Locale,
  targetLocale: Locale,
  pathname: string,
): string {
  const segments = pathname.split("/").filter(Boolean);
  const publicSegment = segments[1];

  if (!publicSegment) {
    return `/${targetLocale}`;
  }

  const internal =
    publicToInternalSegment[locale][publicSegment] ?? publicSegment;
  const route =
    (Object.entries(localizedSegments).find(
      ([key]) => key !== "home" && key === internal,
    )?.[0] as RouteKey | undefined) ?? "home";

  if (route === "home") {
    // Private/local-only routes such as /registration/:token and /admin are
    // deliberately absent from the public route map. Preserve their complete
    // path when switching language instead of dropping a segment.
    return `/${[targetLocale, ...segments.slice(1)].join("/")}`;
  }

  return `/${[
    targetLocale,
    localizedSegments[route][targetLocale],
    ...segments.slice(2),
  ]
    .filter(Boolean)
    .join("/")}`;
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex rounded-full border border-border/80 bg-surface/90 p-1 shadow-sm backdrop-blur"
      aria-label={locale === "uk" ? "Вибір мови" : "Sprachauswahl"}
    >
      {locales.map((targetLocale) => (
        <Link
          href={getLocalizedPath(locale, targetLocale, pathname)}
          key={targetLocale}
          aria-current={targetLocale === locale ? "true" : undefined}
          title={localeLabels[targetLocale]}
          className={cn(
            "nav-pill focus-ring inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-sm font-semibold",
            targetLocale === locale
              ? "bg-blue-strong text-white"
              : "text-ink-muted hover:bg-surface-muted hover:text-blue-strong",
          )}
        >
          {targetLocale.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
