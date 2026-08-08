import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { buildMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { WordPressNewsFeed } from "@/components/content/WordPressNewsFeed";

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
    route: "news",
    title:
      locale === "uk" ? "Новини та анонси" : "Neuigkeiten und Ankündigungen",
    description:
      locale === "uk"
        ? "Актуальні оголошення, майбутні зустрічі та новини SONNENBLUME."
        : "Aktuelle Ankündigungen, kommende Termine und Neuigkeiten von SONNENBLUME.",
  });
}

export default async function NewsPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  return (
    <>
      <PageHeader
        eyebrow={locale === "uk" ? "Будьте в курсі" : "Auf dem Laufenden"}
        title={
          locale === "uk" ? "Новини та анонси" : "Neuigkeiten und Ankündigungen"
        }
        description={
          locale === "uk"
            ? "Тут з’являються оголошення про майбутні концерти, майстер-класи, набори на курси та важливі новини об’єднання."
            : "Hier erscheinen Ankündigungen zu kommenden Konzerten, Workshops, Kursanmeldungen und wichtige Vereinsneuigkeiten."
        }
      >
        <Breadcrumbs
          locale={locale}
          items={[
            {
              label: locale === "uk" ? "Новини" : "Neuigkeiten",
              route: "news",
            },
          ]}
        />
      </PageHeader>
      <Section>
        <WordPressNewsFeed locale={locale} />
      </Section>
    </>
  );
}
