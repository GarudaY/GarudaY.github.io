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
    title: locale === "uk" ? "Наше щодення" : "Was uns bewegt",
    description:
      locale === "uk"
        ? "Новини, активності команди та будні SONNENBLUME."
        : "Neuigkeiten, Teamaktivitäten und Einblicke in den Alltag von SONNENBLUME.",
  });
}

export default async function NewsPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const isUk = locale === "uk";

  return (
    <>
      <PageHeader
        eyebrow={isUk ? "Новини команди" : "Neuigkeiten aus dem Team"}
        title={isUk ? "Наше щодення" : "Was uns bewegt"}
        description={
          isUk
            ? "Тут ми розповідаємо про роботу команди, нові ініціативи та важливі моменти з життя SONNENBLUME. Анонси й фоторозповіді про події залишаються в окремому розділі."
            : "Hier berichten wir über die Arbeit des Teams, neue Initiativen und wichtige Momente aus dem Alltag von SONNENBLUME. Ankündigungen und Fotogeschichten zu Veranstaltungen finden Sie weiterhin im eigenen Event-Bereich."
        }
      >
        <Breadcrumbs
          locale={locale}
          items={[
            {
              label: isUk ? "Наше щодення" : "Was uns bewegt",
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
