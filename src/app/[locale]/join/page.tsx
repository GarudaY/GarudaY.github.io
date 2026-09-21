import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { buildMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { VolunteerOpportunities } from "@/components/contact/VolunteerOpportunities";
import { getPublishedVolunteer } from "@/server/volunteer-opportunities";

type PageProps = { params: Promise<{ locale: string }> };

async function resolveLocale(params: PageProps["params"]): Promise<Locale> {
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
    route: "join",
    title: locale === "uk" ? "Долучитися" : "Mitmachen",
    description:
      locale === "uk"
        ? "Актуальні волонтерські завдання SONNENBLUME або можливість запропонувати власну ідею."
        : "Aktuelle ehrenamtliche Aufgaben bei SONNENBLUME oder die Möglichkeit, eine eigene Idee vorzuschlagen.",
  });
}

export default async function JoinPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const isUk = locale === "uk";
  const roles = await getPublishedVolunteer();
  return (
    <>
      <PageHeader
        eyebrow={isUk ? "Долучитися" : "Mitmachen"}
        title={isUk ? "Волонтерство" : "Ehrenamt"}
        description={
          isUk
            ? "Знайдіть волонтерську справу до душі або запропонуйте власну ідею. Допомагати можна разово чи регулярно, без обов’язкового членства в об’єднанні."
            : "Finden Sie eine ehrenamtliche Aufgabe, die zu Ihnen passt, oder bringen Sie eine eigene Idee mit. Einmalig oder regelmäßig – auch ohne Vereinsmitgliedschaft."
        }
      >
        <Breadcrumbs
          locale={locale}
          items={[{ label: isUk ? "Долучитися" : "Mitmachen", route: "join" }]}
        />
      </PageHeader>
      <Section className="pt-8 lg:pt-10">
        <VolunteerOpportunities locale={locale} roles={roles} />
      </Section>
    </>
  );
}
