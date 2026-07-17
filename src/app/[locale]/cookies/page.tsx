import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { buildMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Alert } from "@/components/ui/Alert";

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
    route: "cookies",
    title: locale === "uk" ? "Cookie-налаштування" : "Cookie-Einstellungen",
    description:
      "Cookie placeholder. No optional cookies are used in this prototype.",
    noIndex: true,
  });
}

export default async function CookiesPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title={locale === "uk" ? "Cookie-налаштування" : "Cookie-Einstellungen"}
        description={dict.legal.german}
      >
        <Breadcrumbs
          locale={locale}
          items={[
            {
              label:
                locale === "uk"
                  ? "Cookie-налаштування"
                  : "Cookie-Einstellungen",
              route: "cookies",
            },
          ]}
        />
      </PageHeader>
      <Section size="narrow">
        <div className="grid gap-6">
          <Alert tone="warning">{dict.legal.placeholder}</Alert>
          <div className="rounded-[8px] border border-border bg-surface p-6 leading-7 text-ink-muted">
            <h2 className="text-2xl font-bold text-blue-strong">
              {locale === "uk" ? "Поточний стан" : "Aktueller Stand"}
            </h2>
            <p className="mt-4">
              {locale === "uk"
                ? "На цьому етапі сайт не використовує аналітику, tracking або необов'язкові cookies, тому cookie banner не додано."
                : "In dieser Phase nutzt die Website keine Analytics, kein Tracking und keine optionalen Cookies. Deshalb gibt es keinen Cookie-Banner."}
            </p>
            <p className="mt-4">
              {locale === "uk"
                ? "Архітектура дозволяє додати consent management пізніше, якщо будуть підключені карти, відео, аналітика або платежі."
                : "Die Architektur erlaubt später Consent Management, falls Karten, Videos, Analytics oder Zahlungen eingebunden werden."}
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
