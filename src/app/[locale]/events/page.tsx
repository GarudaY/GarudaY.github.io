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
    title: locale === "uk" ? "Події" : "Veranstaltungen",
    description:
      locale === "uk"
        ? "Календар найближчих і минулих подій українського Verein у Німеччині."
        : "Kalender kommender und vergangener Veranstaltungen des ukrainischen Vereins.",
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
        eyebrow={locale === "uk" ? "Календар" : "Kalender"}
        title={
          locale === "uk" ? "Події та зустрічі" : "Veranstaltungen und Treffen"
        }
        description={
          locale === "uk"
            ? "Найважливіше для учасника винесено в картки: дата, місце, ціна і дія. Минулі події залишаються в архіві."
            : "Wichtiges steht direkt in den Karten: Datum, Ort, Kosten und Aktion. Vergangene Termine bleiben im Archiv."
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
      <Section>
        <h2 className="mb-6 text-3xl font-bold text-blue-strong">
          {locale === "uk"
            ? "Найближчі події"
            : "Bevorstehende Veranstaltungen"}
        </h2>
        {upcoming.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                locale={locale}
                eager={index < 3}
              />
            ))}
          </div>
        ) : (
          <EmptyState locale={locale} />
        )}
      </Section>
      <Section className="section-soft">
        <h2 className="mb-6 text-3xl font-bold text-blue-strong">
          {locale === "uk" ? "Минулі події" : "Vergangene Veranstaltungen"}
        </h2>
        {past.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {past.map((event) => (
              <EventCard key={event.id} event={event} locale={locale} />
            ))}
          </div>
        ) : (
          <EmptyState locale={locale} />
        )}
      </Section>
    </>
  );
}
