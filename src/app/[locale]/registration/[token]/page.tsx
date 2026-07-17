import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarCheck2, Hash, UsersRound } from "lucide-react";
import { getRegistrationByToken } from "@/server/operations-service";
import { isLocale, type Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { CancelRegistrationButton } from "@/components/events/CancelRegistrationButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string; token: string }> };

export const metadata: Metadata = {
  title: "Registration status",
  robots: { index: false, follow: false },
};

export default async function RegistrationStatusPage({ params }: PageProps) {
  const { locale: rawLocale, token } = await params;
  if (!isLocale(rawLocale) || !/^[a-f0-9]{64}$/.test(token)) notFound();
  const locale = rawLocale as Locale;
  const registration = await getRegistrationByToken(token);
  if (!registration) notFound();
  const isUk = locale === "uk";

  const statusLabel =
    registration.status === "confirmed"
      ? isUk
        ? "Підтверджено"
        : "Bestätigt"
      : registration.status === "waitlist"
        ? isUk
          ? "Список очікування"
          : "Warteliste"
        : isUk
          ? "Скасовано"
          : "Storniert";

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
        <Card className="p-6 sm:p-8">
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${
              registration.status === "confirmed"
                ? "bg-green/20 text-blue-strong"
                : registration.status === "waitlist"
                  ? "bg-yellow/25 text-blue-strong"
                  : "bg-danger/10 text-danger"
            }`}
          >
            {statusLabel}
          </span>
          <h2 className="mt-5 text-3xl font-bold text-blue-strong">
            {registration.eventTitle}
          </h2>
          <dl className="mt-7 grid gap-4 text-sm text-ink-muted sm:grid-cols-2">
            <div className="flex gap-3 rounded-[12px] bg-surface-muted p-4">
              <Hash aria-hidden="true" className="h-5 w-5 shrink-0 text-blue" />
              <div>
                <dt className="font-semibold text-blue-strong">
                  {isUk ? "Номер" : "Nummer"}
                </dt>
                <dd>{registration.reference}</dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-[12px] bg-surface-muted p-4">
              <UsersRound
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-blue"
              />
              <div>
                <dt className="font-semibold text-blue-strong">
                  {isUk ? "Учасники" : "Personen"}
                </dt>
                <dd>{registration.participants}</dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-[12px] bg-surface-muted p-4 sm:col-span-2">
              <CalendarCheck2
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-blue"
              />
              <div>
                <dt className="font-semibold text-blue-strong">
                  {isUk ? "Створено" : "Erstellt"}
                </dt>
                <dd>
                  {new Intl.DateTimeFormat(isUk ? "uk-UA" : "de-DE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Europe/Berlin",
                  }).format(new Date(registration.createdAt))}
                </dd>
              </div>
            </div>
          </dl>
          <CancelRegistrationButton
            token={token}
            locale={locale}
            initialStatus={registration.status}
          />
          <LinkButton
            href={getPath(locale, "events", registration.eventSlug)}
            variant="quiet"
            className="mt-5"
          >
            {isUk ? "Повернутися до події" : "Zur Veranstaltung"}
          </LinkButton>
        </Card>
      </Section>
    </>
  );
}
