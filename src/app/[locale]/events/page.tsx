import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPastEvents } from "@/data/content";
import { isLocale, type Locale } from "@/i18n/config";
import { buildMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
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
    title:
      locale === "uk"
        ? "Події — фоторозповіді"
        : "Veranstaltungen — Fotogeschichten",
    description:
      locale === "uk"
        ? "Фотографії та короткі розповіді про минулі події SONNENBLUME."
        : "Fotos und kurze Geschichten vergangener Veranstaltungen von SONNENBLUME.",
  });
}

export default async function EventsPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const past = await getPastEvents();

  return (
    <>
      <PageHeader
        eyebrow={locale === "uk" ? "Життя спільноти" : "Gemeinschaft erleben"}
        title={
          locale === "uk"
            ? "Події у фотографіях та історіях"
            : "Veranstaltungen in Bildern und Geschichten"
        }
        description={
          locale === "uk"
            ? "Кожна зустріч залишає свою історію. Тут ми збираємо фотографії й короткі розповіді про вже проведені події."
            : "Jede Begegnung hinterlässt eine Geschichte. Hier sammeln wir Fotos und kurze Rückblicke auf bereits stattgefundene Veranstaltungen."
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
