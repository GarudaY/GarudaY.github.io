import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getDonationSettings } from "@/data/content";
import { isLocale, type Locale } from "@/i18n/config";
import { buildMetadata } from "@/lib/metadata";
import { t, tList } from "@/lib/localize";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Alert } from "@/components/ui/Alert";
import { DonationMethodCard } from "@/components/content/DonationMethodCard";

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
  const donations = await getDonationSettings();
  return buildMetadata({
    locale,
    route: "donate",
    title: t(donations.seo.title, locale),
    description: t(donations.seo.description, locale),
  });
}

export default async function DonatePage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const donations = await getDonationSettings();

  return (
    <>
      <PageHeader
        eyebrow={locale === "uk" ? "Підтримка" : "Unterstützung"}
        title={t(donations.title, locale)}
        description={t(donations.description, locale)}
      >
        <Breadcrumbs
          locale={locale}
          items={[
            {
              label: locale === "uk" ? "Підтримати" : "Spenden",
              route: "donate",
            },
          ]}
        />
      </PageHeader>
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div className="grid gap-6">
            <Alert tone="warning">
              {locale === "uk"
                ? "У прототипі немає реальних платежів, PayPal API або справжнього QR-коду. Це архітектурна підготовка."
                : "Im Prototyp gibt es keine echten Zahlungen, PayPal API oder echten QR-Code. Dies ist eine vorbereitete Architektur."}
            </Alert>
            <div className="rounded-[8px] border border-border bg-surface p-5">
              <h2 className="text-2xl font-bold text-blue-strong">
                {locale === "uk"
                  ? "На що йде допомога"
                  : "Wofür Hilfe genutzt wird"}
              </h2>
              <ul className="mt-5 grid gap-3">
                {tList(donations.impact, locale).map((item) => (
                  <li
                    className="flex gap-3 text-sm leading-6 text-ink-muted"
                    key={item}
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 text-green"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {donations.methods.map((method) => (
              <DonationMethodCard
                key={method.id}
                method={method}
                locale={locale}
              />
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
