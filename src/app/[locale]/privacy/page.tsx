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
    route: "privacy",
    title: locale === "uk" ? "Захист даних" : "Datenschutzerklärung",
    description: "Privacy placeholder. Not legal advice.",
    noIndex: true,
  });
}

export default async function PrivacyPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title={locale === "uk" ? "Захист даних" : "Datenschutzerklärung"}
        description={dict.legal.german}
      >
        <Breadcrumbs
          locale={locale}
          items={[
            {
              label: locale === "uk" ? "Захист даних" : "Datenschutzerklärung",
              route: "privacy",
            },
          ]}
        />
      </PageHeader>
      <Section size="narrow">
        <div className="grid gap-6">
          <Alert tone="warning">{dict.legal.placeholder}</Alert>
          <div className="rounded-[8px] border border-border bg-surface p-6 leading-7 text-ink-muted">
            <h2 className="text-2xl font-bold text-blue-strong">
              {locale === "uk"
                ? "Що буде додано перед запуском"
                : "Was vor dem Launch ergänzt wird"}
            </h2>
            <ul className="mt-4 grid gap-2">
              <li>
                -{" "}
                {locale === "uk"
                  ? "реальний Verantwortlicher / controller"
                  : "echter Verantwortlicher"}
              </li>
              <li>
                -{" "}
                {locale === "uk"
                  ? "опис обробки форм"
                  : "Beschreibung der Formularverarbeitung"}
              </li>
              <li>
                -{" "}
                {locale === "uk"
                  ? "хостинг, медіа і зовнішні сервіси"
                  : "Hosting, Medien und externe Dienste"}
              </li>
              <li>
                -{" "}
                {locale === "uk"
                  ? "строки зберігання та права користувача"
                  : "Speicherfristen und Betroffenenrechte"}
              </li>
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
