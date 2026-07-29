import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getAdminOperations } from "@/server/operations-service";
import { isLocalAdminHost } from "@/server/request-guard";
import { adminCookieName, verifyAdminSession } from "@/server/admin-auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Alert } from "@/components/ui/Alert";
import { AdminOperations } from "@/components/admin/AdminOperations";
import { AdminLogin } from "@/components/admin/AdminLogin";

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
  const locale = rawLocale as Locale;
  const isUk = locale === "uk";
  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const authenticated =
    isLocalAdminHost(requestHeaders.get("host")) ||
    (await verifyAdminSession(cookieStore.get(adminCookieName)?.value));

  return (
    <>
      <PageHeader
        eyebrow={isUk ? "Панель команди" : "Team-Bereich"}
        title={isUk ? "Заявки та звернення" : "Anmeldungen und Anfragen"}
        description={
          isUk
            ? "Онлайн-черга реєстрацій, контактних звернень і статусів поштових сповіщень."
            : "Online-Übersicht für Anmeldungen, Kontaktanfragen und den Status der E-Mail-Benachrichtigungen."
        }
      />
      <Section>
        {authenticated ? (
          <>
            <Alert className="mb-8">
              {isUk
                ? "Дані зберігаються у постійній захищеній базі. Завершені звернення й скасовані заявки автоматично видаляються після налаштованого строку зберігання."
                : "Die Daten werden dauerhaft in einer geschützten Datenbank gespeichert. Erledigte Anfragen und stornierte Anmeldungen werden nach der eingestellten Aufbewahrungsfrist automatisch gelöscht."}
            </Alert>
            <AdminOperations locale={locale} {...await getAdminOperations()} />
          </>
        ) : (
          <AdminLogin locale={locale} />
        )}
      </Section>
    </>
  );
}
