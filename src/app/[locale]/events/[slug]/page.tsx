import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { getEventBySlug } from "@/data/content";
import { isLocale, type Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { formatDate, formatTime, t } from "@/lib/localize";
import { buildMetadata, routeBreadcrumbJsonLd } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { ContentImage } from "@/components/ui/ContentImage";
import { EventStatusBadge } from "@/components/content/StatusBadge";
import { PhotoCarousel } from "@/components/content/PhotoCarousel";
import { JsonLd } from "@/components/ui/JsonLd";
import { siteConfig } from "@/config/site";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

async function resolveParams(
  params: Promise<{ locale: string; slug: string }>,
) {
  const resolved = await params;
  if (!isLocale(resolved.locale)) notFound();
  return { locale: resolved.locale as Locale, slug: resolved.slug };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await resolveParams(params);
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  return buildMetadata({
    locale,
    route: "events",
    slug: event.slug,
    title: t(event.seo.title, locale),
    description: t(event.seo.description, locale),
    image: event.image.src,
  });
}

export default async function EventDetailPage({ params }: PageProps) {
  const { locale, slug } = await resolveParams(params);
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  const isUpcoming = event.eventStatus === "upcoming";
  const isCancelled = event.eventStatus === "cancelled";
  const isAnnouncement = event.archiveType === "announcement";
  const breadcrumbItems = [
    {
      label: locale === "uk" ? "Події" : "Veranstaltungen",
      route: "events" as const,
    },
    {
      label: t(event.title, locale),
      route: "events" as const,
      slug: event.slug,
    },
  ];
  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: t(event.title, locale),
    description: t(event.summary, locale),
    url: new URL(
      getPath(locale, "events", event.slug),
      siteConfig.baseUrl,
    ).toString(),
    image: new URL(event.image.src, siteConfig.baseUrl).toString(),
    startDate: event.dateLabel ? undefined : event.startsAt,
    endDate: event.endsAt,
    eventStatus: isCancelled
      ? "https://schema.org/EventCancelled"
      : isUpcoming
        ? "https://schema.org/EventScheduled"
        : undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: t(event.location, locale) },
    organizer: {
      "@type": "Organization",
      name: event.organizerName ?? "SONNENBLUME — Interkultureller Verein e.V.",
      url: event.organizerName
        ? undefined
        : new URL(getPath(locale, "home"), siteConfig.baseUrl).toString(),
    },
  };

  return (
    <>
      <JsonLd data={eventJsonLd} />
      <JsonLd data={routeBreadcrumbJsonLd(locale, breadcrumbItems)} />
      <PageHeader
        eyebrow={
          isCancelled
            ? locale === "uk"
              ? "Подію скасовано"
              : "Veranstaltung abgesagt"
            : isUpcoming
            ? locale === "uk"
              ? "Анонс"
              : "Ankündigung"
            : isAnnouncement
              ? locale === "uk"
                ? "Архівний анонс"
                : "Archivierte Ankündigung"
              : locale === "uk"
                ? "Фоторозповідь"
                : "Fotogeschichte"
        }
        title={t(event.title, locale)}
        description={t(event.summary, locale)}
      >
        <Breadcrumbs locale={locale} items={breadcrumbItems} />
      </PageHeader>
      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <article className="min-w-0">
            {isUpcoming || isAnnouncement ? (
              <ContentImage
                image={event.image}
                locale={locale}
                className={
                  isAnnouncement
                    ? "aspect-[3/4] bg-white"
                    : "aspect-[4/3] sm:aspect-[16/10]"
                }
                preload
              />
            ) : (
              <PhotoCarousel
                images={[event.image, ...event.gallery]}
                locale={locale}
                className="aspect-[4/3] sm:aspect-[16/10]"
                preloadFirst
              />
            )}
            <div className="mx-auto mt-9 max-w-3xl">
              {isAnnouncement ? (
                <a
                  href={event.image.src}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring mb-6 inline-flex min-h-11 items-center rounded-full text-sm font-semibold text-blue underline underline-offset-4"
                >
                  {locale === "uk"
                    ? "Відкрити оригінальну афішу"
                    : "Originalplakat öffnen"}
                </a>
              ) : null}
              <h2 className="text-3xl font-bold text-blue-strong">
                {isCancelled
                  ? locale === "uk"
                    ? "Про скасування"
                    : "Zur Absage"
                  : isUpcoming
                  ? locale === "uk"
                    ? "Про подію"
                    : "Über die Veranstaltung"
                  : isAnnouncement
                    ? locale === "uk"
                      ? "Про цей анонс"
                      : "Über diese Ankündigung"
                    : locale === "uk"
                      ? "Як це було"
                      : "So war es"}
              </h2>
              <p className="mt-4 text-lg leading-8 text-ink-muted">
                {t(event.description, locale)}
              </p>
            </div>
          </article>
          <aside className="lg:sticky lg:top-28">
            <Card className="p-5">
              <EventStatusBadge status={event.eventStatus} locale={locale} />
              <dl className="mt-6 grid gap-5 text-sm text-ink-muted">
                <div className="flex gap-3">
                  <CalendarDays
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue"
                  />
                  <div>
                    <dt className="font-semibold text-blue-strong">
                      {locale === "uk" ? "Дата" : "Datum"}
                    </dt>
                    <dd>
                      {event.dateLabel
                        ? t(event.dateLabel, locale)
                        : formatDate(event.startsAt, locale)}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue"
                  />
                  <div>
                    <dt className="font-semibold text-blue-strong">
                      {locale === "uk" ? "Час" : "Zeit"}
                    </dt>
                    <dd>
                      {event.timeLabel
                        ? t(event.timeLabel, locale)
                        : `${formatTime(event.startsAt, locale)}${
                            event.endsAt
                              ? ` – ${formatTime(event.endsAt, locale)}`
                              : ""
                          }`}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue"
                  />
                  <div>
                    <dt className="font-semibold text-blue-strong">
                      {locale === "uk" ? "Місце" : "Ort"}
                    </dt>
                    <dd>{t(event.location, locale)}</dd>
                  </div>
                </div>
              </dl>
              {isUpcoming ? (
                <LinkButton
                  href={`${getPath(locale, "contact")}?topic=event-${event.slug}`}
                  className="mt-6 w-full"
                >
                  {t(event.registrationLabel, locale)}
                </LinkButton>
              ) : null}
              <LinkButton
                href={getPath(locale, "events")}
                variant="ghost"
                className={`${isUpcoming ? "mt-3" : "mt-6"} w-full`}
              >
                {locale === "uk" ? "До всіх подій" : "Zu allen Veranstaltungen"}
              </LinkButton>
            </Card>
          </aside>
        </div>
      </Section>
    </>
  );
}
