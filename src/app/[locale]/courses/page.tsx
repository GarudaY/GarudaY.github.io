import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourses, getTeachers } from "@/data/content";
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
  const [courses, teachers] = await Promise.all([getCourses(), getTeachers()]);

  return (
    <>
      <PageHeader
        eyebrow={locale === "uk" ? "Каталог" : "Katalog"}
        title={
          locale === "uk"
            ? "Курси та регулярні заняття"
            : "Kurse und regelmäßige Angebote"
        }
        description={
          locale === "uk"
            ? "Фільтри залишені короткими: категорія і відкритий набір. Це краще для невеликого Verein і мобільного UX."
            : "Die Filter bleiben bewusst kurz: Kategorie und offene Anmeldung. Das passt besser zu kleinem Verein und mobilem UX."
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
        <CourseFilters courses={courses} teachers={teachers} locale={locale} />
      </Section>
    </>
  );
}
