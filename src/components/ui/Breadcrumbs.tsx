import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { RouteKey } from "@/i18n/routing";
import { getPath } from "@/i18n/routing";

export type BreadcrumbItem = {
  label: string;
  route: RouteKey;
  slug?: string;
};

export function Breadcrumbs({
  locale,
  items,
}: {
  locale: Locale;
  items: BreadcrumbItem[];
}) {
  return (
    <nav
      aria-label={
        locale === "uk" ? "Навігаційний шлях" : "Brotkrümelnavigation"
      }
      className="mb-6 text-sm text-ink-muted"
    >
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link
            href={getPath(locale, "home")}
            className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface-muted hover:text-blue-strong"
          >
            <Home aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">
              {locale === "uk" ? "Головна" : "Startseite"}
            </span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              className="flex items-center gap-2"
              key={`${item.route}-${item.slug ?? item.label}`}
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
              {isLast ? (
                <span
                  aria-current="page"
                  className="font-medium text-blue-strong"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={getPath(locale, item.route, item.slug)}
                  className="focus-ring -mx-2 inline-flex min-h-11 items-center rounded-full px-2 hover:text-blue-strong"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
