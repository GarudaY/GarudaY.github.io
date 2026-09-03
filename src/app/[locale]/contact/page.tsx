import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteSettings } from "@/data/content";
import { isLocale, type Locale } from "@/i18n/config";
import { buildMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { ContactCard } from "@/components/contact/ContactCard";
import { ContactForm } from "@/components/contact/ContactForm";

type PageProps = {
  params: Promise<{ locale: string }>;
};

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
    route: "contact",
    title: locale === "uk" ? "Контакти" : "Kontakt",
    description:
      locale === "uk"
        ? "Контакти та форма зв'язку українського Verein у Німеччині."
        : "Kontaktdaten und Formular des ukrainischen Vereins.",
  });
}

export default async function ContactPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader
        eyebrow={locale === "uk" ? "Контакти" : "Kontakt"}
        title={
          locale === "uk"
            ? "Зв'язатися з SONNENBLUME"
            : "Kontakt zu SONNENBLUME"
        }
        description={
          locale === "uk"
            ? "Один зрозумілий шлях для курсів, подій, партнерств і волонтерства."
            : "Ein klarer Weg für Kurse, Veranstaltungen, Partnerschaften und Ehrenamt."
        }
      >
        <Breadcrumbs
          locale={locale}
          items={[
            {
              label: locale === "uk" ? "Контакти" : "Kontakt",
              route: "contact",
            },
          ]}
        />
      </PageHeader>
      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <ContactCard contact={settings.contact} locale={locale} />
          <ContactForm locale={locale} />
        </div>
      </Section>
    </>
  );
}
