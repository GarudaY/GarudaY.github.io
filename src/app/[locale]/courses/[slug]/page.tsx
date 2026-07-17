import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Languages,
  MapPin,
  Presentation,
  Users,
} from "lucide-react";
import {
  getCourseBySlug,
  getCourses,
  getPeopleByIds,
  getRelatedCourses,
} from "@/data/content";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { formatDate, t, tList } from "@/lib/localize";
import { buildMetadata, routeBreadcrumbJsonLd } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { ContentImage } from "@/components/ui/ContentImage";
import { Card } from "@/components/ui/Card";
import { CourseStatusBadge } from "@/components/content/StatusBadge";
import { PersonCard } from "@/components/content/PersonCard";
import { CourseCard } from "@/components/content/CourseCard";
import { JsonLd } from "@/components/ui/JsonLd";
import { siteConfig } from "@/config/site";
import { MobileActionBar } from "@/components/ui/MobileActionBar";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

async function resolveParams(
  params: Promise<{ locale: string; slug: string }>,
) {
  const resolved = await params;
  if (!isLocale(resolved.locale)) notFound();
  return { locale: resolved.locale as Locale, slug: resolved.slug };
}

export async function generateStaticParams() {
  const courses = await getCourses();
  return locales.flatMap((locale) =>
    courses.map((course) => ({ locale, slug: course.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await resolveParams(params);
  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  return buildMetadata({
    locale,
    route: "courses",
    slug: course.slug,
    title: t(course.seo.title, locale),
    description: t(course.seo.description, locale),
    image: course.image.src,
  });
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { locale, slug } = await resolveParams(params);
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const [teachers, relatedCourses] = await Promise.all([
    getPeopleByIds(course.teacherIds),
    getRelatedCourses(course),
  ]);
  const relatedTeachers = await getPeopleByIds(
    relatedCourses.flatMap((item) => item.teacherIds),
  );

  const breadcrumbItems = [
    { label: locale === "uk" ? "Курси" : "Kurse", route: "courses" as const },
    {
      label: t(course.title, locale),
      route: "courses" as const,
      slug: course.slug,
    },
  ];

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: t(course.title, locale),
    description: t(course.summary, locale),
    url: new URL(
      getPath(locale, "courses", course.slug),
      siteConfig.baseUrl,
    ).toString(),
    image: new URL(course.image.src, siteConfig.baseUrl).toString(),
    provider: {
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
      <JsonLd data={courseJsonLd} />
      <JsonLd data={routeBreadcrumbJsonLd(locale, breadcrumbItems)} />
      <PageHeader
        eyebrow={locale === "uk" ? "Курс" : "Kurs"}
        title={t(course.title, locale)}
        description={t(course.summary, locale)}
      >
        <Breadcrumbs locale={locale} items={breadcrumbItems} />
      </PageHeader>
      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <article className="min-w-0">
            <ContentImage
              image={course.image}
              locale={locale}
              className="aspect-[16/9]"
              preload
            />
            <div className="mt-8 grid gap-8">
              <section>
                <h2 className="text-2xl font-bold text-blue-strong">
                  {locale === "uk" ? "Про курс" : "Über den Kurs"}
                </h2>
                <p className="mt-4 text-lg leading-8 text-ink-muted">
                  {t(course.description, locale)}
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-bold text-blue-strong">
                  {locale === "uk"
                    ? "Що учасник отримає"
                    : "Was Teilnehmende mitnehmen"}
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {tList(course.outcomes, locale).map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 rounded-[8px] bg-surface p-4"
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 h-5 w-5 shrink-0 text-green"
                      />
                      <span className="text-sm leading-6 text-ink-muted">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h2 className="text-2xl font-bold text-blue-strong">
                  {locale === "uk" ? "Матеріали" : "Materialien"}
                </h2>
                <ul className="mt-4 grid gap-2 text-ink-muted">
                  {tList(course.materials, locale).map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h2 className="text-2xl font-bold text-blue-strong">
                  {locale === "uk" ? "Викладачі" : "Dozentinnen und Dozenten"}
                </h2>
                <div className="mt-5 grid gap-5">
                  {teachers.map((teacher) => (
                    <PersonCard
                      key={teacher.id}
                      person={teacher}
                      locale={locale}
                    />
                  ))}
                </div>
              </section>
            </div>
          </article>

          <aside className="lg:sticky lg:top-28">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <CourseStatusBadge
                  status={course.enrollmentStatus}
                  locale={locale}
                />
                <span className="text-sm font-semibold text-blue-strong">
                  {course.seatsAvailable}/{course.seatsTotal}{" "}
                  {locale === "uk" ? "місць" : "Plätze"}
                </span>
              </div>
              <dl className="mt-6 grid gap-4 text-sm text-ink-muted">
                <div className="flex gap-3">
                  <Users
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue"
                  />
                  <div>
                    <dt className="font-semibold text-blue-strong">
                      {locale === "uk" ? "Вік" : "Alter"}
                    </dt>
                    <dd>{t(course.ageGroup, locale)}</dd>
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
                    <dd>{t(course.location, locale)}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Languages
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue"
                  />
                  <div>
                    <dt className="font-semibold text-blue-strong">
                      {locale === "uk" ? "Мова" : "Sprache"}
                    </dt>
                    <dd>{t(course.language, locale)}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Presentation
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue"
                  />
                  <div>
                    <dt className="font-semibold text-blue-strong">
                      {locale === "uk" ? "Формат" : "Format"}
                    </dt>
                    <dd>{t(course.format, locale)}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CalendarDays
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue"
                  />
                  <div>
                    <dt className="font-semibold text-blue-strong">
                      {locale === "uk" ? "Старт" : "Start"}
                    </dt>
                    <dd>{formatDate(course.startsAt, locale)}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue"
                  />
                  <div>
                    <dt className="font-semibold text-blue-strong">
                      {locale === "uk" ? "Розклад" : "Zeitplan"}
                    </dt>
                    <dd>
                      {course.schedule
                        .map(
                          (item) => `${t(item.weekday, locale)} ${item.time}`,
                        )
                        .join(", ")}
                    </dd>
                  </div>
                </div>
              </dl>
              <div className="mt-6 rounded-[8px] bg-surface-muted p-4">
                <p className="text-sm font-semibold text-blue-strong">
                  {t(course.price, locale)}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {t(course.duration, locale)}
                </p>
              </div>
              <div className="hidden lg:block">
                <LinkButton
                  href={`${getPath(locale, "contact")}?topic=course-${course.slug}`}
                  className="mt-5 w-full"
                >
                  {locale === "uk"
                    ? "Запитати про запис"
                    : "Anmeldung anfragen"}
                </LinkButton>
              </div>
            </Card>
          </aside>
        </div>
      </Section>

      {relatedCourses.length ? (
        <Section className="section-soft">
          <h2 className="mb-6 text-3xl font-bold text-blue-strong">
            {locale === "uk" ? "Схожі курси" : "Ähnliche Kurse"}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedCourses.map((item) => (
              <CourseCard
                key={item.id}
                course={item}
                locale={locale}
                teachers={relatedTeachers.filter((teacher) =>
                  item.teacherIds.includes(teacher.id),
                )}
              />
            ))}
          </div>
        </Section>
      ) : null}
      <MobileActionBar>
        <LinkButton
          href={`${getPath(locale, "contact")}?topic=course-${course.slug}`}
          className="w-full"
        >
          {locale === "uk" ? "Запитати про запис" : "Anmeldung anfragen"}
        </LinkButton>
      </MobileActionBar>
    </>
  );
}
