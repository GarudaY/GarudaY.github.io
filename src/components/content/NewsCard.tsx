import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { formatDate, t } from "@/lib/localize";
import type { NewsArticle } from "@/types/content";
import { Card } from "@/components/ui/Card";
import { ContentImage } from "@/components/ui/ContentImage";

export function NewsCard({
  article,
  locale,
}: {
  article: NewsArticle;
  locale: Locale;
}) {
  return (
    <Card className="group overflow-hidden">
      <Link
        href={getPath(locale, "news", article.slug)}
        className="focus-ring block rounded-[18px]"
      >
        <ContentImage
          image={article.image}
          locale={locale}
          className="aspect-[16/9] rounded-none"
          sizes="(min-width: 1024px) 33vw, 100vw"
        />
        <div className="grid gap-4 p-5">
          <p className="text-sm font-semibold text-blue">
            {formatDate(article.publishedAt, locale)}
          </p>
          <h2 className="text-xl font-bold leading-snug text-blue-strong group-hover:text-blue">
            {t(article.title, locale)}
          </h2>
          <p className="line-clamp-3 text-sm leading-6 text-ink-muted">
            {t(article.excerpt, locale)}
          </p>
          <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-semibold text-blue-strong">
            <span>{t(article.author, locale)}</span>
            <ArrowRight
              aria-hidden="true"
              className="h-5 w-5 text-blue transition group-hover:translate-x-1"
            />
          </div>
        </div>
      </Link>
    </Card>
  );
}
