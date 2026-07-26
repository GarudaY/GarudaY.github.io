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
    route: "impressum",
    title: "Impressum",
    description: "Impressum von SONNENBLUME — Ukraine Community MG e.V.",
  });
}

export default async function ImpressumPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Impressum"
        description={
          locale === "uk"
            ? "Юридична інформація про SONNENBLUME — Ukraine Community MG e.V."
            : "Rechtliche Angaben zu SONNENBLUME — Ukraine Community MG e.V."
        }
      >
        <Breadcrumbs
          locale={locale}
          items={[{ label: "Impressum", route: "impressum" }]}
        />
      </PageHeader>
      <Section size="narrow">
        <div className="grid gap-5">
          <div className="rounded-[18px] border border-border bg-surface p-6 leading-7 text-ink-muted">
            <h2 className="text-2xl font-bold text-blue-strong">
              Angaben gemäß § 5 DDG
            </h2>
            <p className="mt-4 font-semibold text-blue-strong">
              SONNENBLUME — Ukraine Community MG e.V.
            </p>
            <p>Welfenstraße 10</p>
            <p>41238 Mönchengladbach</p>
            <p>Deutschland</p>
          </div>
          <div className="rounded-[18px] border border-border bg-surface p-6 leading-7 text-ink-muted">
            <h2 className="text-2xl font-bold text-blue-strong">
              Vertretungsberechtigter Vorstand
            </h2>
            <p className="mt-4">Olga Pivovarova, 1. Vorsitzende</p>
            <p>Oleksandra Zhytnyakova, stellvertretende Vorsitzende</p>
            <p>Natalia Petrova, Schatzmeisterin</p>
          </div>
          <div className="rounded-[18px] border border-border bg-surface p-6 leading-7 text-ink-muted">
            <h2 className="text-2xl font-bold text-blue-strong">
              Register und Kontakt
            </h2>
            <p className="mt-4">
              Eingetragen beim Amtsgericht Mönchengladbach, Vereinsregister Nr.
              5713
            </p>
            <p>
              E-Mail:{" "}
              <a
                className="focus-ring rounded-full font-semibold text-blue hover:underline"
                href="mailto:kontakt@sonnenblume-mg.com"
              >
                kontakt@sonnenblume-mg.com
              </a>
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
