import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getAdminOperations } from "@/server/operations-service";
import { isLocalAdminHost } from "@/server/request-guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Alert } from "@/components/ui/Alert";
import { AdminOperations } from "@/components/admin/AdminOperations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Local operations",
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const requestHeaders = await headers();
  if (!isLocalAdminHost(requestHeaders.get("host"))) notFound();
  const locale = rawLocale as Locale;
  const data = await getAdminOperations();
  const isUk = locale === "uk";

  return (
    <>
      <PageHeader
        eyebrow={isUk ? "Локальна адмін-панель" : "Lokaler Admin-Bereich"}
        title={isUk ? "Заявки та звернення" : "Anmeldungen und Anfragen"}
        description={
          isUk
            ? "Операційна панель працює без сторонніх сервісів і доступна лише через localhost."
            : "Der operative Bereich funktioniert ohne externe Dienste und ist nur über localhost erreichbar."
        }
      />
      <Section>
        <Alert className="mb-8">
          {isUk
            ? "Дані зберігаються у локальному файлі .data/operations.json. Файл виключено з Git. Завершені звернення й скасовані заявки автоматично видаляються через налаштований строк зберігання."
            : "Die Daten liegen lokal in .data/operations.json und sind von Git ausgeschlossen. Erledigte Anfragen und stornierte Anmeldungen werden nach der konfigurierten Aufbewahrungsfrist automatisch gelöscht."}
        </Alert>
        <AdminOperations locale={locale} {...data} />
      </Section>
    </>
  );
}
