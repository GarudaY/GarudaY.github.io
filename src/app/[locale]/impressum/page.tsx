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
    route: "impressum",
    title: "Impressum",
    description: "Legal placeholder for a German Verein website.",
    noIndex: true,
  });
}

export default async function ImpressumPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Impressum"
        description={dict.legal.german}
      >
        <Breadcrumbs
          locale={locale}
          items={[{ label: "Impressum", route: "impressum" }]}
        />
      </PageHeader>
      <Section size="narrow">
        <div className="grid gap-6">
          <Alert tone="warning">{dict.legal.placeholder}</Alert>
          <div className="rounded-[8px] border border-border bg-surface p-6 leading-7 text-ink-muted">
            <h2 className="text-2xl font-bold text-blue-strong">Platzhalter</h2>
            <p className="mt-4">Vereinsname: Demo Ukrainian Verein e.V.</p>
            <p>Adresse: Demohaus, Musterstrasse 12, 00000 Musterstadt</p>
            <p>Vertreten durch: Demo Vorstand</p>
            <p>E-Mail: kontakt@example-verein.de</p>
            <p className="mt-4">{dict.legal.german}</p>
          </div>
        </div>
      </Section>
    </>
  );
}
