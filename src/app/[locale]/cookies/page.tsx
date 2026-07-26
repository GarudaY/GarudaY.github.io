import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { buildMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";

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
      locale === "uk"
        ? "Інформація про cookies на сайті SONNENBLUME."
        : "Informationen zu Cookies auf der Website von SONNENBLUME.",
  });
}

export default async function CookiesPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title={locale === "uk" ? "Cookie-налаштування" : "Cookie-Einstellungen"}
        description={
          locale === "uk"
            ? "Сайт працює без аналітики, рекламного tracking та необов'язкових cookies."
            : "Die Website funktioniert ohne Analytics, Werbe-Tracking und optionale Cookies."
        }
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
          <div className="rounded-[18px] border border-border bg-surface p-6 leading-7 text-ink-muted">
            <h2 className="text-2xl font-bold text-blue-strong">
              {locale === "uk" ? "Поточний стан" : "Aktueller Stand"}
            </h2>
            <p className="mt-4">
              {locale === "uk"
                ? "Сайт не використовує аналітику, рекламний tracking або необов'язкові cookies, тому банер згоди не потрібен."
                : "Die Website nutzt keine Analytics, kein Werbe-Tracking und keine optionalen Cookies. Deshalb ist kein Einwilligungsbanner erforderlich."}
            </p>
            <p className="mt-4">
              {locale === "uk"
                ? "Якщо пізніше буде підключено карти, зовнішні відео, аналітику або платежі, ця інформація та механізм згоди мають бути оновлені до активації сервісів."
                : "Falls später Karten, externe Videos, Analytics oder Zahlungen eingebunden werden, werden diese Information und ein erforderliches Einwilligungsmanagement vor der Aktivierung ergänzt."}
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
