import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCoursesByIds,
  getEventsByIds,
  getNewsArticleBySlug,
  getNewsArticles,
} from "@/data/content";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { formatDate, t, tList } from "@/lib/localize";
import { buildMetadata, routeBreadcrumbJsonLd } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContentImage } from "@/components/ui/ContentImage";
import { Section } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { EventCard } from "@/components/content/EventCard";
import { CourseCard } from "@/components/content/CourseCard";
import { getPeopleByIds } from "@/data/content";
import { getPath } from "@/i18n/routing";
import { siteConfig } from "@/config/site";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

async function resolveParams(
  params: Promise<{ locale: string; slug: string }>,
) {
  const resolved = await params;
  if (!isLocale(resolved.locale)) notFound();
  return { locale: resolved.locale as Locale, slug: resolved.slug };
}

export async function generateStaticParams() {
  const articles = await getNewsArticles();
  return locales.flatMap((locale) =>
    articles.map((article) => ({ locale, slug: article.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await resolveParams(params);
  const article = await getNewsArticleBySlug(slug);
  if (!article) notFound();
  return buildMetadata({
    locale,
    route: "news",
    slug: article.slug,
    title: t(article.seo.title, locale),
    description: t(article.seo.description, locale),
    image: article.image.src,
    openGraphType: "article",
    publishedTime: article.publishedAt,
  });
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { locale, slug } = await resolveParams(params);
  const article = await getNewsArticleBySlug(slug);
  if (!article) notFound();
  const [relatedEvents, relatedCourses] = await Promise.all([
    getEventsByIds(article.relatedEventIds),
    getCoursesByIds(article.relatedCourseIds),
  ]);
  const relatedTeachers = await getPeopleByIds(
    relatedCourses.flatMap((course) => course.teacherIds),
  );

  const breadcrumbItems = [
    {
      label: locale === "uk" ? "Новини" : "Neuigkeiten",
      route: "news" as const,
    },
    {
      label: t(article.title, locale),
      route: "news" as const,
      slug: article.slug,
    },
  ];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t(article.title, locale),
    description: t(article.excerpt, locale),
    mainEntityOfPage: new URL(
      getPath(locale, "news", article.slug),
      siteConfig.baseUrl,
    ).toString(),
    image: new URL(article.image.src, siteConfig.baseUrl).toString(),
    datePublished: article.publishedAt,
    author: { "@type": "Organization", name: t(article.author, locale) },
    publisher: {
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
      <JsonLd data={articleJsonLd} />
      <JsonLd data={routeBreadcrumbJsonLd(locale, breadcrumbItems)} />
      <PageHeader
        eyebrow={formatDate(article.publishedAt, locale)}
        title={t(article.title, locale)}
        description={t(article.excerpt, locale)}
      >
        <Breadcrumbs locale={locale} items={breadcrumbItems} />
      </PageHeader>
      <Section>
        <article className="mx-auto max-w-4xl">
          <ContentImage
            image={article.image}
            locale={locale}
            className="aspect-[16/9]"
            preload
          />
          <div className="mt-8 grid gap-5 text-lg leading-8 text-ink-muted">
            {tList(article.body, locale).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      </Section>
      {relatedEvents.length ? (
        <Section className="section-soft">
          <h2 className="mb-6 text-3xl font-bold text-blue-strong">
            {locale === "uk" ? "Пов'язані події" : "Verknüpfte Veranstaltungen"}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedEvents.map((event) => (
              <EventCard key={event.id} event={event} locale={locale} />
            ))}
          </div>
        </Section>
      ) : null}
      {relatedCourses.length ? (
        <Section>
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
    </>
  );
}
