import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNewsArticles } from "@/data/content";
import { isLocale, type Locale } from "@/i18n/config";
import { buildMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { NewsCard } from "@/components/content/NewsCard";

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
    title: locale === "uk" ? "Новини" : "Neuigkeiten",
    description:
      locale === "uk"
        ? "Оголошення, звіти і матеріали українського Verein у Німеччині."
        : "Ankündigungen, Rückblicke und Materialien des ukrainischen Vereins.",
  });
}

export default async function NewsPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const news = await getNewsArticles();

  return (
    <>
      <PageHeader
        eyebrow={locale === "uk" ? "Оновлення" : "Updates"}
        title={
          locale === "uk"
            ? "Новини та оголошення"
            : "Neuigkeiten und Ankündigungen"
        }
        description={
          locale === "uk"
            ? "Новини можуть бути пов'язані з курсами і подіями, щоб редактор не дублював контент."
            : "Meldungen können mit Kursen und Veranstaltungen verknüpft werden, ohne Inhalte zu duplizieren."
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
        {news.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {news.map((article) => (
              <NewsCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        ) : (
          <EmptyState locale={locale} />
        )}
      </Section>
    </>
  );
}
