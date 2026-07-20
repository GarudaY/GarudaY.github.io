import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { RegistrationStatusClient } from "@/components/events/RegistrationStatusClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Registration status",
  robots: { index: false, follow: false },
};

export default async function RegistrationStatusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const isUk = locale === "uk";

  return (
    <>
      <PageHeader
        eyebrow={isUk ? "Приватний статус" : "Privater Status"}
        title={isUk ? "Ваша заявка на подію" : "Ihre Veranstaltungsanmeldung"}
        description={
          isUk
            ? "Ця сторінка доступна лише за приватним посиланням. Не публікуйте й не пересилайте його стороннім."
            : "Diese Seite ist nur über den privaten Link erreichbar. Veröffentlichen oder teilen Sie ihn nicht mit Dritten."
        }
      />
      <Section size="narrow">
        <RegistrationStatusClient locale={locale} />
      </Section>
    </>
  );
}
