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
    route: "privacy",
    title: locale === "uk" ? "Захист даних" : "Datenschutzerklärung",
    description:
      locale === "uk"
        ? "Інформація про обробку персональних даних на сайті SONNENBLUME."
        : "Informationen zur Verarbeitung personenbezogener Daten auf der Website von SONNENBLUME.",
  });
}

export default async function PrivacyPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const isUk = locale === "uk";

  const sections = [
    {
      title: isUk
        ? "1. Відповідальна організація"
        : "1. Verantwortliche Stelle",
      body: (
        <>
          <p>SONNENBLUME — Interkultureller Verein e.V.</p>
          <p>Welfenstraße 10, 41238 Mönchengladbach</p>
          <p>
            E-Mail:{" "}
            <a
              href="mailto:kontakt@sonnenblume-mg.com"
              className="focus-ring rounded-full font-semibold text-blue hover:underline"
            >
              kontakt@sonnenblume-mg.com
            </a>
          </p>
        </>
      ),
    },
    {
      title: isUk ? "2. Технічний доступ" : "2. Technischer Zugriff",
      body: (
        <p>
          {isUk
            ? "Під час відкриття сторінки хостинг технічно обробляє дані, необхідні для доставки сайту й безпеки, наприклад IP-адресу, час запиту, сторінку, тип браузера та відповіді сервера. Ці дані не використовуються нами для реклами або профілювання."
            : "Beim Aufruf der Website verarbeitet das Hosting technisch erforderliche Daten zur Auslieferung und Sicherheit, etwa IP-Adresse, Zeitpunkt, aufgerufene Seite, Browsertyp und Serverantwort. Wir verwenden diese Daten nicht für Werbung oder Profilbildung."}
        </p>
      ),
    },
    {
      title: isUk ? "3. Контактна форма" : "3. Kontaktformular",
      body: (
        <>
          <p>
            {isUk
              ? "Форма зберігає ім'я, e-mail, тему, повідомлення, мову, технічний контекст запиту та час наданої згоди. Дані потрібні, щоб опрацювати звернення у структурованій внутрішній черзі."
              : "Das Formular speichert Name, E-Mail-Adresse, Thema, Nachricht, Sprache, technischen Anfragekontext und den Zeitpunkt der Einwilligung. Die Daten werden benötigt, um die Anfrage in einer strukturierten internen Warteschlange zu bearbeiten."}
          </p>
          <p className="mt-3">
            {isUk
              ? "Підстава — ваша згода. Дані видаляються після завершення мети звернення, якщо немає законного обов'язку зберігати їх довше. Згоду можна відкликати на майбутнє електронною поштою."
              : "Rechtsgrundlage ist Ihre Einwilligung. Die Daten werden nach Abschluss des Anfragezwecks gelöscht, sofern keine gesetzliche Aufbewahrungspflicht besteht. Die Einwilligung kann für die Zukunft per E-Mail widerrufen werden."}
          </p>
        </>
      ),
    },
    {
      title: isUk ? "4. Реєстрація на події" : "4. Veranstaltungsanmeldung",
      body: (
        <p>
          {isUk
            ? "Для реєстрації обробляються ім'я, e-mail, кількість і тип учасників, примітка, статус місця та час згоди. Після реєстрації створюється приватне посилання для перевірки або скасування. Не передавайте його стороннім."
            : "Für Anmeldungen werden Name, E-Mail-Adresse, Anzahl und Gruppe der Teilnehmenden, optionale Notiz, Platzstatus und Einwilligungszeitpunkt verarbeitet. Danach entsteht ein privater Link zur Prüfung oder Stornierung. Bitte geben Sie ihn nicht weiter."}
        </p>
      ),
    },
    {
      title: isUk
        ? "5. Зовнішні посилання та файли"
        : "5. Externe Links und Dateien",
      body: (
        <p>
          {isUk
              ? "Посилання на Instagram, Facebook, партнерські сайти та DSEE відкриваються лише після вашого кліку. PDF-файли заяв, статуту й SEPA розміщено як завантаження; введені у PDF дані автоматично не надсилаються на сайт."
              : "Links zu Instagram, Facebook, Partnerseiten und der DSEE werden erst nach Ihrem Klick geöffnet. PDF-Dateien zu Antrag, Satzung und SEPA stehen als Downloads bereit; in PDFs eingetragene Daten werden nicht automatisch an die Website übermittelt."}
        </p>
      ),
    },
    {
      title: isUk ? "6. Аналітика та cookies" : "6. Analytics und Cookies",
      body: (
        <p>
          {isUk
            ? "Сайт не використовує рекламний tracking, вебаналітику або необов'язкові cookies. Зовнішні карти, відеоплеєри й платіжні віджети не вбудовано."
            : "Die Website verwendet kein Werbe-Tracking, keine Webanalyse und keine optionalen Cookies. Externe Karten, Videoplayer und Zahlungswidgets sind nicht eingebettet."}
        </p>
      ),
    },
    {
      title: isUk ? "7. Ваші права" : "7. Ihre Rechte",
      body: (
        <p>
          {isUk
            ? "Ви можете звернутися щодо доступу, виправлення, видалення, обмеження обробки, перенесення даних, заперечення або відкликання згоди. Також можна подати скаргу до компетентного органу захисту даних."
            : "Sie können Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch oder den Widerruf einer Einwilligung verlangen. Zudem besteht ein Beschwerderecht bei der zuständigen Datenschutzaufsicht."}
        </p>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title={isUk ? "Захист даних" : "Datenschutzerklärung"}
        description={
          isUk
            ? "Зрозуміло пояснюємо, які дані потрібні сайту і для чого."
            : "Transparent erklärt: welche Daten die Website benötigt und wofür."
        }
      >
        <Breadcrumbs
          locale={locale}
          items={[
            {
              label: isUk ? "Захист даних" : "Datenschutzerklärung",
              route: "privacy",
            },
          ]}
        />
      </PageHeader>
      <Section size="narrow">
        <div className="grid gap-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[18px] border border-border bg-surface p-6 leading-7 text-ink-muted"
            >
              <h2 className="text-xl font-bold text-blue-strong">
                {section.title}
              </h2>
              <div className="mt-4">{section.body}</div>
            </section>
          ))}
          <p className="text-xs text-ink-muted">
            {isUk ? "Стан: 8 серпня 2026 року." : "Stand: 8. August 2026."}
          </p>
        </div>
      </Section>
    </>
  );
}
