import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPastEvents, getUpcomingEvents } from "@/data/content";
import { isLocale, type Locale } from "@/i18n/config";
import { buildMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { EventCard } from "@/components/content/EventCard";
import { EventStoryCard } from "@/components/content/EventStoryCard";

type PageProps = { params: Promise<{ locale: string }> };

async function resolveLocale(
  params: Promise<{ locale: string }>,
): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return buildMetadata({
    locale,
    route: "events",
    title: locale === "uk" ? "Події та анонси" : "Veranstaltungen und Termine",
    description:
      locale === "uk"
        ? "Найближчі події, фотографії та короткі розповіді про зустрічі SONNENBLUME."
        : "Kommende Termine, Fotos und kurze Geschichten von SONNENBLUME.",
  });
}

export default async function EventsPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={locale === "uk" ? "Життя спільноти" : "Gemeinschaft erleben"}
        title={
          locale === "uk"
            ? "Події, на які чекаємо і які пам’ятаємо"
            : "Termine, auf die wir uns freuen und an die wir uns erinnern"
        }
        description={
          locale === "uk"
            ? "Тут зібрані найближчі анонси SONNENBLUME та фоторозповіді про вже проведені зустрічі."
            : "Hier finden Sie kommende SONNENBLUME-Termine und Fotogeschichten vergangener Begegnungen."
        }
      >
        <Breadcrumbs
          locale={locale}
          items={[
            {
              label: locale === "uk" ? "Події" : "Veranstaltungen",
              route: "events",
            },
          ]}
        />
      </PageHeader>
      {upcoming.length ? (
        <Section>
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {locale === "uk" ? "Анонси" : "Ankündigungen"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {locale === "uk" ? "Найближчі події" : "Kommende Veranstaltungen"}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {upcoming.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                locale={locale}
                eager={index < 2}
              />
            ))}
          </div>
        </Section>
      ) : null}
      <Section className="section-soft">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {locale === "uk" ? "Архів" : "Rückblicke"}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-blue-strong">
            {locale === "uk" ? "Як це було" : "So war es"}
          </h2>
        </div>
        {past.length ? (
          <div className="grid gap-8 lg:gap-12">
            {past.map((event) => (
              <EventStoryCard key={event.id} event={event} locale={locale} />
            ))}
          </div>
        ) : (
          <EmptyState locale={locale} />
        )}
      </Section>
    </>
  );
}
