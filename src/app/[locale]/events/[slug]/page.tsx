import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, UsersRound } from "lucide-react";
import {
  getCoursesByIds,
  getEventBySlug,
  getEvents,
  getNewsByIds,
} from "@/data/content";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { formatDate, formatTime, t } from "@/lib/localize";
import { buildMetadata, routeBreadcrumbJsonLd } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContentImage } from "@/components/ui/ContentImage";
import { Section } from "@/components/ui/Section";
import { EventStatusBadge } from "@/components/content/StatusBadge";
import { CourseCard } from "@/components/content/CourseCard";
import { NewsCard } from "@/components/content/NewsCard";
import { JsonLd } from "@/components/ui/JsonLd";
import { getPeopleByIds } from "@/data/content";
import { siteConfig } from "@/config/site";
import { ImageGallery } from "@/components/content/ImageGallery";
import { EmptyState } from "@/components/ui/EmptyState";
import { MobileActionBar } from "@/components/ui/MobileActionBar";
import { EventRegistrationForm } from "@/components/events/EventRegistrationForm";
import { EventSeatAvailability } from "@/components/events/EventSeatAvailability";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

async function resolveParams(
  params: Promise<{ locale: string; slug: string }>,
) {
  const resolved = await params;
  if (!isLocale(resolved.locale)) notFound();
  return { locale: resolved.locale as Locale, slug: resolved.slug };
}

export async function generateStaticParams() {
  const events = await getEvents();
  return locales.flatMap((locale) =>
    events.map((event) => ({ locale, slug: event.slug })),
  );
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
  const [relatedCourses, relatedNews] = await Promise.all([
    getCoursesByIds(event.relatedCourseIds),
    getNewsByIds(event.relatedArticleIds),
  ]);
  const relatedTeachers = await getPeopleByIds(
    relatedCourses.flatMap((course) => course.teacherIds),
  );

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
    startDate: event.startsAt,
    endDate: event.endsAt,
    maximumAttendeeCapacity: event.capacity,
    remainingAttendeeCapacity: event.seatsAvailable,
    eventStatus:
      event.eventStatus === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: t(event.location, locale),
      address: t(event.location, locale),
    },
    organizer: {
      "@type": "Organization",
      name:
        locale === "uk"
          ? "Український Verein у Німеччині"
          : "Ukrainischer Verein in Deutschland",
      url: new URL(getPath(locale, "home"), siteConfig.baseUrl).toString(),
    },
  };

  return (
    <>
      <JsonLd data={eventJsonLd} />
      <JsonLd data={routeBreadcrumbJsonLd(locale, breadcrumbItems)} />
      <PageHeader
        eyebrow={locale === "uk" ? "Подія" : "Veranstaltung"}
        title={t(event.title, locale)}
        description={t(event.summary, locale)}
      >
        <Breadcrumbs locale={locale} items={breadcrumbItems} />
      </PageHeader>
      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <article>
            <ContentImage
              image={event.image}
              locale={locale}
              className="aspect-[16/9]"
              preload
            />
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-blue-strong">
                {locale === "uk" ? "Опис" : "Beschreibung"}
              </h2>
              <p className="mt-4 text-lg leading-8 text-ink-muted">
                {t(event.description, locale)}
              </p>
            </div>
            <section className="mt-8 rounded-[8px] border border-dashed border-blue/40 bg-surface-muted p-5">
              <div className="flex gap-3">
                <MapPin
                  aria-hidden="true"
                  className="mt-1 h-6 w-6 shrink-0 text-blue"
                />
                <div>
                  <h2 className="text-xl font-bold text-blue-strong">
                    {locale === "uk" ? "Карта та маршрут" : "Karte und Anfahrt"}
                  </h2>
                  <p className="mt-2 font-semibold text-blue-strong">
                    {t(event.location, locale)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {locale === "uk"
                      ? "Карту без стороннього відстеження буде підключено після підтвердження реальної адреси та стратегії згоди."
                      : "Eine datenschutzfreundliche Karte wird nach Bestätigung der echten Adresse und Consent-Strategie ergänzt."}
                  </p>
                </div>
              </div>
            </section>
            <div className="mt-10">
              {event.gallery.length ? (
                <>
                  <h2 className="text-2xl font-bold text-blue-strong">
                    {locale === "uk" ? "Галерея" : "Galerie"}
                  </h2>
                  <ImageGallery images={event.gallery} locale={locale} />
                </>
              ) : (
                <EmptyState
                  locale={locale}
                  title={
                    locale === "uk"
                      ? "Фотографій поки немає"
                      : "Noch keine Fotos"
                  }
                  body={
                    locale === "uk"
                      ? "Після події редактор зможе додати сюди добірку зображень через CMS."
                      : "Nach der Veranstaltung kann die Redaktion hier Bilder über die CMS ergänzen."
                  }
                />
              )}
            </div>
          </article>
          <aside className="lg:sticky lg:top-28">
            <Card className="p-5">
              <EventStatusBadge status={event.eventStatus} locale={locale} />
              <dl className="mt-6 grid gap-4 text-sm text-ink-muted">
                <div className="flex gap-3">
                  <CalendarDays
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue"
                  />
                  <div>
                    <dt className="font-semibold text-blue-strong">
                      {locale === "uk" ? "Дата" : "Datum"}
                    </dt>
                    <dd>{formatDate(event.startsAt, locale)}</dd>
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
                      {formatTime(event.startsAt, locale)}
                      {event.endsAt
                        ? ` - ${formatTime(event.endsAt, locale)}`
                        : ""}
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
                <div className="flex gap-3">
                  <UsersRound
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue"
                  />
                  <div>
                    <dt className="font-semibold text-blue-strong">
                      {locale === "uk" ? "Вільні місця" : "Freie Plätze"}
                    </dt>
                    <dd>
                      <EventSeatAvailability
                        eventSlug={event.slug}
                        locale={locale}
                        initialAvailable={event.seatsAvailable}
                        capacity={event.capacity}
                        registrationLabel={t(event.registrationLabel, locale)}
                      />
                    </dd>
                  </div>
                </div>
              </dl>
              <div className="mt-6 rounded-[8px] bg-surface-muted p-4 text-sm">
                <p className="font-semibold text-blue-strong">
                  {t(event.price, locale)}
                </p>
              </div>
              {event.eventStatus === "upcoming" ? (
                <div className="hidden lg:block">
                  <LinkButton
                    href="#event-registration"
                    className="mt-5 w-full"
                  >
                    {locale === "uk" ? "Зареєструватися" : "Jetzt anmelden"}
                  </LinkButton>
                </div>
              ) : (
                <LinkButton
                  href={getPath(locale, "events")}
                  variant="ghost"
                  className="mt-5 w-full"
                >
                  {locale === "uk"
                    ? "Переглянути майбутні події"
                    : "Kommende Veranstaltungen ansehen"}
                </LinkButton>
              )}
            </Card>
          </aside>
        </div>
      </Section>
      {event.eventStatus === "upcoming" ? (
        <Section className="pt-0">
          <EventRegistrationForm
            locale={locale}
            eventSlug={event.slug}
            eventTitle={t(event.title, locale)}
            capacity={event.capacity}
            seatsAvailable={event.seatsAvailable}
          />
        </Section>
      ) : null}
      {relatedCourses.length ? (
        <Section className="section-soft">
          <h2 className="mb-6 text-3xl font-bold text-blue-strong">
            {locale === "uk" ? "Пов'язані курси" : "Verknüpfte Kurse"}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                locale={locale}
                teachers={relatedTeachers.filter((teacher) =>
                  course.teacherIds.includes(teacher.id),
                )}
              />
            ))}
          </div>
        </Section>
      ) : null}
      {relatedNews.length ? (
        <Section>
          <h2 className="mb-6 text-3xl font-bold text-blue-strong">
            {locale === "uk" ? "Пов'язані новини" : "Verknüpfte Neuigkeiten"}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedNews.map((article) => (
              <NewsCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        </Section>
      ) : null}
      {event.eventStatus === "upcoming" ? (
        <MobileActionBar>
          <LinkButton href="#event-registration" className="w-full">
            {locale === "uk" ? "Зареєструватися" : "Jetzt anmelden"}
          </LinkButton>
        </MobileActionBar>
      ) : null}
    </>
  );
}
