import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { formatTime, t } from "@/lib/localize";
import type { Event } from "@/types/content";
import { Card } from "@/components/ui/Card";
import { ContentImage } from "@/components/ui/ContentImage";
import { EventDateBadge } from "@/components/content/EventDateBadge";
import { EventStatusBadge } from "@/components/content/StatusBadge";

const categoryLabels = {
  community: { uk: "Спільнота", de: "Community" },
  culture: { uk: "Культура", de: "Kultur" },
  children: { uk: "Для дітей", de: "Für Kinder" },
  integration: { uk: "Інтеграція", de: "Integration" },
  charity: { uk: "Благодійність", de: "Benefiz" },
};

export function EventCard({
  event,
  locale,
  eager,
}: {
  event: Event;
  locale: Locale;
  eager?: boolean;
}) {
  return (
    <Card className="group overflow-hidden">
      <Link
        href={getPath(locale, "events", event.slug)}
        className="focus-ring block rounded-[18px]"
      >
        <ContentImage
          image={event.image}
          locale={locale}
          className="aspect-[16/10] rounded-none"
          sizes="(min-width: 1024px) 33vw, 100vw"
          eager={eager}
        />
        <div className="grid gap-4 p-5">
          <div className="flex items-start gap-4">
            <EventDateBadge date={event.startsAt} locale={locale} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <EventStatusBadge status={event.eventStatus} locale={locale} />
                <span className="text-xs font-semibold text-ink-muted">
                  {t(categoryLabels[event.category], locale)}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-bold leading-snug text-blue-strong group-hover:text-blue">
                {t(event.title, locale)}
              </h2>
            </div>
          </div>
          <p className="line-clamp-3 text-sm leading-6 text-ink-muted">
            {t(event.summary, locale)}
          </p>
          <dl className="grid gap-2 text-sm text-ink-muted">
            <div className="flex gap-2">
              <Clock
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-blue"
              />
              <dt className="sr-only">{locale === "uk" ? "Час" : "Zeit"}</dt>
              <dd>{formatTime(event.startsAt, locale)}</dd>
            </div>
            <div className="flex gap-2">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-blue"
              />
              <dt className="sr-only">{locale === "uk" ? "Місце" : "Ort"}</dt>
              <dd>{t(event.location, locale)}</dd>
            </div>
          </dl>
          <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-semibold text-blue-strong">
            <span>{t(event.price, locale)}</span>
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
