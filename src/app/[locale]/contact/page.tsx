import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPinned } from "lucide-react";
import { getSiteSettings } from "@/data/content";
import { isLocale, type Locale } from "@/i18n/config";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/localize";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Alert } from "@/components/ui/Alert";
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
        ? "Контакти, години прийому і форма зв'язку українського Verein у Німеччині."
        : "Kontaktdaten, Sprechzeiten und Formular des ukrainischen Vereins.",
  });
}

export default async function ContactPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader
        eyebrow={locale === "uk" ? "Контакти" : "Kontakt"}
        title={locale === "uk" ? "Зв'язатися з Verein" : "Kontakt zum Verein"}
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
          <div className="grid gap-5">
            <ContactCard contact={settings.contact} locale={locale} />
            <Alert>{t(settings.contact.mapNote, locale)}</Alert>
            <div className="relative min-h-72 overflow-hidden rounded-[8px] bg-blue-strong p-7 text-white shadow-soft">
              <div className="absolute -right-14 -top-16 h-56 w-56 rounded-full bg-yellow/25" />
              <div className="absolute -bottom-20 -left-14 h-52 w-52 rounded-full bg-blue/50" />
              <div className="relative flex h-full min-h-58 flex-col justify-between">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white/12">
                  <MapPinned
                    aria-hidden="true"
                    className="h-7 w-7 text-yellow"
                  />
                </span>
                <div className="mt-12 max-w-md">
                  <p className="text-2xl font-bold">
                    {locale === "uk" ? "Спланувати візит" : "Besuch planen"}
                  </p>
                  <p className="mt-3 leading-7 text-white/78">
                    {locale === "uk"
                      ? "Перед першим візитом напишіть або зателефонуйте: команда підтвердить адресу, час і доступність приміщення."
                      : "Bitte schreiben Sie vor dem ersten Besuch oder rufen Sie an. Das Team bestätigt Adresse, Zeit und Barrierefreiheit."}
                  </p>
                  <p className="mt-5 text-sm font-semibold text-yellow">
                    {t(settings.contact.officeHours, locale)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <ContactForm locale={locale} />
        </div>
      </Section>
    </>
  );
}
