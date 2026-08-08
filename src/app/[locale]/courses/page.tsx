import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail } from "lucide-react";
import { getCourses, getSiteSettings, getTeachers } from "@/data/content";
import { isLocale, type Locale } from "@/i18n/config";
import { buildMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { CourseFilters } from "@/components/courses/CourseFilters";

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
    route: "courses",
    title: locale === "uk" ? "Курси" : "Kurse",
    description:
      locale === "uk"
        ? "Каталог мовних, дитячих, культурних та інтеграційних курсів українського Verein."
        : "Katalog von Sprach-, Kinder-, Kultur- und Integrationsangeboten des ukrainischen Vereins.",
  });
}

export default async function CoursesPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const [courses, teachers, settings] = await Promise.all([
    getCourses(),
    getTeachers(),
    getSiteSettings(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={locale === "uk" ? "Каталог" : "Katalog"}
        title={
          locale === "uk"
            ? "Курси та регулярні заняття"
            : "Kurse und regelmäßige Angebote"
        }
      >
        <Breadcrumbs
          locale={locale}
          items={[
            { label: locale === "uk" ? "Курси" : "Kurse", route: "courses" },
          ]}
        />
      </PageHeader>
      <Section>
        <div className="mb-7 flex flex-col gap-3 rounded-[18px] border border-yellow/50 bg-yellow/12 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-blue-strong">
              {locale === "uk"
                ? "Запис і запитання про курси"
                : "Anmeldung und Fragen zu Kursen"}
            </p>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              {locale === "uk"
                ? "Напишіть нам — команда підкаже наявність місць і умови участі."
                : "Schreiben Sie uns – das Team informiert über freie Plätze und Teilnahmebedingungen."}
            </p>
          </div>
          <a
            className="focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full font-semibold text-blue hover:text-blue-strong"
            href={`mailto:${settings.contact.coursesEmail}`}
          >
            <Mail aria-hidden="true" className="h-4 w-4" />
            {settings.contact.coursesEmail}
          </a>
        </div>
        <CourseFilters courses={courses} teachers={teachers} locale={locale} />
      </Section>
    </>
  );
}
