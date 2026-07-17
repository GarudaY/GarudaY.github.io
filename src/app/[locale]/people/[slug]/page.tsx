import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCoursesByIds, getPeople, getPersonBySlug } from "@/data/content";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/localize";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContentImage } from "@/components/ui/ContentImage";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { CourseCard } from "@/components/content/CourseCard";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

async function resolveParams(
  params: Promise<{ locale: string; slug: string }>,
) {
  const resolved = await params;
  if (!isLocale(resolved.locale)) notFound();
  return { locale: resolved.locale as Locale, slug: resolved.slug };
}

export async function generateStaticParams() {
  const people = await getPeople();
  return locales.flatMap((locale) =>
    people.map((person) => ({ locale, slug: person.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await resolveParams(params);
  const person = await getPersonBySlug(slug);
  if (!person) notFound();
  return buildMetadata({
    locale,
    route: "people",
    slug: person.slug,
    title: t(person.seo.title, locale),
    description: t(person.seo.description, locale),
    image: person.image.src,
    noIndex: person.isDemo,
  });
}

export default async function PersonPage({ params }: PageProps) {
  const { locale, slug } = await resolveParams(params);
  const person = await getPersonBySlug(slug);
  if (!person) notFound();
  const courses = await getCoursesByIds(person.relatedCourseIds);

  return (
    <>
      <PageHeader
        eyebrow={locale === "uk" ? "Профіль" : "Profil"}
        title={t(person.name, locale)}
        description={t(person.roleLabel, locale)}
      >
        <Breadcrumbs
          locale={locale}
          items={[
            { label: locale === "uk" ? "Про нас" : "Über uns", route: "about" },
            {
              label: t(person.name, locale),
              route: "people",
              slug: person.slug,
            },
          ]}
        />
      </PageHeader>
      <Section>
        <div className="grid gap-10 lg:grid-cols-[20rem_1fr]">
          <div>
            <ContentImage
              image={person.image}
              locale={locale}
              className="aspect-square"
              preload
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {person.isDemo ? <Badge tone="yellow">Demo</Badge> : null}
              {person.roles.map((role) => (
                <Badge tone="blue" key={role}>
                  {role}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-blue-strong">
              {locale === "uk" ? "Про людину" : "Über diese Person"}
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink-muted">
              {t(person.bio, locale)}
            </p>
            <dl className="mt-8 grid gap-4 rounded-[8px] border border-border bg-surface p-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold text-blue-strong">
                  {locale === "uk" ? "Мови" : "Sprachen"}
                </dt>
                <dd className="mt-1 text-ink-muted">
                  {person.languages
                    .map((lang) => lang.toUpperCase())
                    .join(" / ")}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-blue-strong">
                  {locale === "uk" ? "Профіль" : "Profil"}
                </dt>
                <dd className="mt-1 text-ink-muted">
                  {person.isDemo
                    ? locale === "uk"
                      ? "Демонстраційний"
                      : "Demo"
                    : "Real"}
                </dd>
              </div>
            </dl>
            <LinkButton
              href={getPath(locale, "contact")}
              variant="ghost"
              className="mt-8"
            >
              {locale === "uk" ? "Зв'язатися з Verein" : "Verein kontaktieren"}
            </LinkButton>
          </div>
        </div>
      </Section>
      {courses.length ? (
        <Section className="section-soft">
          <h2 className="mb-6 text-3xl font-bold text-blue-strong">
            {locale === "uk" ? "Пов'язані курси" : "Verknüpfte Kurse"}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                locale={locale}
                teachers={[person]}
              />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
