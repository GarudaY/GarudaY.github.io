import { CalendarDays, MapPin } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { formatDate, t } from "@/lib/localize";
import type { Event } from "@/types/content";
import { LinkButton } from "@/components/ui/Button";
import { PhotoCarousel } from "@/components/content/PhotoCarousel";

export function EventStoryCard({
  event,
  locale,
}: {
  event: Event;
  locale: Locale;
}) {
  const photos = [event.image, ...event.gallery];

  return (
    <article className="event-story grid overflow-hidden rounded-[24px] border border-border bg-surface shadow-soft lg:grid-cols-[minmax(0,1.12fr)_minmax(19rem,0.88fr)]">
      <PhotoCarousel
        images={photos}
        locale={locale}
        className="aspect-[4/3] rounded-none lg:min-h-[30rem] lg:aspect-auto"
      />
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-blue">
          <span className="inline-flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            {formatDate(event.startsAt, locale)}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin aria-hidden="true" className="h-4 w-4" />
            {t(event.location, locale)}
          </span>
        </div>
        <h2 className="mt-5 text-3xl font-bold text-blue-strong">
          {t(event.title, locale)}
        </h2>
        <p className="mt-4 text-base leading-7 text-ink-muted">
          {t(event.description, locale)}
        </p>
        <LinkButton
          href={getPath(locale, "events", event.slug)}
          variant="ghost"
          className="mt-7 self-start"
        >
          {locale === "uk" ? "Відкрити фоторозповідь" : "Fotogeschichte öffnen"}
        </LinkButton>
      </div>
    </article>
  );
}
