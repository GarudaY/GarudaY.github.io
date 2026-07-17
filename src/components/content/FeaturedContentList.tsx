import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { t } from "@/lib/localize";
import type { FeaturedContent } from "@/types/content";
import { Badge } from "@/components/ui/Badge";

export function FeaturedContentList({
  items,
  locale,
}: {
  items: FeaturedContent[];
  locale: Locale;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <Link
          href={getPath(locale, item.hrefRoute, item.slug)}
          key={item.id}
          className="feature-card focus-ring group grid min-h-56 rounded-[18px] border border-border bg-surface p-5 shadow-soft"
        >
          <div>
            <Badge tone={item.type === "donation" ? "yellow" : "blue"}>
              {t(item.badge, locale)}
            </Badge>
            <h2 className="mt-5 text-xl font-bold leading-snug text-blue-strong">
              {t(item.title, locale)}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              {t(item.summary, locale)}
            </p>
          </div>
          <span className="mt-6 flex items-center gap-2 self-end text-sm font-semibold text-blue">
            {locale === "uk" ? "Перейти" : "Öffnen"}
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition group-hover:translate-x-1"
            />
          </span>
        </Link>
      ))}
    </div>
  );
}
