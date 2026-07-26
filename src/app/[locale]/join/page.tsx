import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowDownToLine,
  BriefcaseBusiness,
  CalendarHeart,
  Check,
  FileText,
  HandHeart,
  Languages,
  Laptop,
  Megaphone,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { ContactForm } from "@/components/contact/ContactForm";

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
    route: "join",
    title: locale === "uk" ? "Долучитися" : "Mitmachen",
    description:
      locale === "uk"
        ? "Волонтерство без членства, вступ до SONNENBLUME, партнерство та актуальні проєкти."
        : "Ehrenamt ohne Mitgliedschaft, Vereinsbeitritt, Partnerschaft und aktuelle Projekte bei SONNENBLUME.",
  });
}

export default async function JoinPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const isUk = locale === "uk";

  const ways = [
    {
      icon: HandHeart,
      badge: isUk ? "Без внеску" : "Ohne Beitrag",
      title: isUk ? "Зовнішнє волонтерство" : "Externes Ehrenamt",
      text: isUk
        ? "Допомагайте разово або регулярно без вступу до Verein. Обсяг і напрям узгоджуємо до початку."
        : "Einmalig oder regelmäßig helfen, ohne dem Verein beizutreten. Umfang und Aufgabe werden vorher abgestimmt.",
      items: isUk
        ? ["Гнучкий формат", "Чітке завдання", "Контактна особа від Verein"]
        : ["Flexibles Format", "Klare Aufgabe", "Ansprechperson im Verein"],
      href: "#mitmachen-formular",
      cta: isUk ? "Запропонувати допомогу" : "Hilfe anbieten",
    },
    {
      icon: UsersRound,
      badge: isUk ? "24–120 € / рік" : "24–120 € / Jahr",
      title: isUk ? "Членство у Verein" : "Vereinsmitgliedschaft",
      text: isUk
        ? "Для тих, хто хоче довгостроково підтримувати цілі SONNENBLUME та формально приєднатися до організації."
        : "Für Menschen, die die Ziele von SONNENBLUME langfristig unterstützen und dem Verein formell beitreten möchten.",
      items: isUk
        ? ["Заява на вступ", "Ознайомлення зі статутом", "Окрема згода на дані"]
        : ["Aufnahmeantrag", "Kenntnis der Satzung", "Separate Datenschutzinformation"],
      href: "#membership-documents",
      cta: isUk ? "Завантажити документи" : "Unterlagen herunterladen",
    },
    {
      icon: Sparkles,
      badge: isUk ? "Організації й ініціативи" : "Organisationen & Initiativen",
      title: isUk ? "Партнерство" : "Partnerschaft",
      text: isUk
        ? "Спільні події, експертна допомога, приміщення, матеріали або інформаційна підтримка."
        : "Gemeinsame Veranstaltungen, Fachwissen, Räume, Materialien oder kommunikative Unterstützung.",
      items: isUk
        ? ["Спільна мета", "Прозорі ролі", "Публічна подяка за згодою"]
        : ["Gemeinsames Ziel", "Transparente Rollen", "Öffentlicher Dank nach Abstimmung"],
      href: `${getPath(locale, "contact")}?topic=partnership`,
      cta: isUk ? "Обговорити співпрацю" : "Zusammenarbeit besprechen",
    },
  ];

  const opportunities = [
    {
      icon: Languages,
      title: isUk ? "Переклад" : "Übersetzung",
      text: isUk ? "DE / UK, усно або письмово" : "DE / UK, mündlich oder schriftlich",
    },
    {
      icon: CalendarHeart,
      title: isUk ? "Події" : "Veranstaltungen",
      text: isUk ? "Підготовка, гості, логістика" : "Vorbereitung, Gäste, Logistik",
    },
    {
      icon: Megaphone,
      title: isUk ? "Комунікація" : "Kommunikation",
      text: isUk ? "Тексти, фото, соцмережі" : "Texte, Fotos, soziale Medien",
    },
    {
      icon: Laptop,
      title: isUk ? "Цифрова підтримка" : "Digitale Unterstützung",
      text: isUk ? "Сайт, форми, онлайн-зустрічі" : "Website, Formulare, Online-Treffen",
    },
  ];

  const documents = [
    {
      title: isUk ? "Заява на вступ — українською" : "Aufnahmeantrag — Ukrainisch",
      note: isUk ? "Форма для заповнення" : "Formular zum Ausfüllen",
      href: "/documents/membership/mitgliedsantrag-uk.pdf",
    },
    {
      title: isUk ? "Заява на вступ — німецькою" : "Aufnahmeantrag — Deutsch",
      note: isUk ? "Німецька офіційна версія" : "Deutsche Fassung",
      href: "/documents/membership/mitgliedsantrag-de.pdf",
    },
    {
      title: isUk ? "Статут SONNENBLUME" : "Satzung von SONNENBLUME",
      note: isUk ? "Чинний документ німецькою" : "Gültiges Dokument auf Deutsch",
      href: "/documents/membership/satzung-sonnenblume.pdf",
    },
    {
      title: isUk ? "Захист даних для членів" : "Datenschutzinformation für Mitglieder",
      note: isUk ? "Інформація відповідно до DSGVO" : "Information gemäß DSGVO",
      href: "/documents/membership/datenschutz-mitglieder-de.pdf",
    },
    {
      title: isUk ? "SEPA-мандат" : "SEPA-Lastschriftmandat",
      note: isUk ? "Для оплати внеску через SEPA" : "Für die Beitragszahlung per SEPA",
      href: "/documents/membership/sepa-lastschriftmandat.pdf",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={isUk ? "Долучитися" : "Mitmachen"}
        title={
          isUk
            ? "Допомагати можна по-різному"
            : "Engagement hat mehr als eine Form"
        }
        description={
          isUk
            ? "Волонтерство без членства, формальний вступ і партнерство — це три окремі шляхи. Оберіть той, який відповідає вашому часу та бажаному рівню відповідальності."
            : "Ehrenamt ohne Mitgliedschaft, formeller Beitritt und Partnerschaft sind drei getrennte Wege. Wählen Sie, was zu Ihrer Zeit und gewünschten Verantwortung passt."
        }
      >
        <Breadcrumbs
          locale={locale}
          items={[
            {
              label: isUk ? "Долучитися" : "Mitmachen",
              route: "join",
            },
          ]}
        />
      </PageHeader>

      <Section>
        <div className="grid gap-5 lg:grid-cols-3">
          {ways.map((way) => {
            const Icon = way.icon;
            return (
              <article
                key={way.title}
                className="card-surface flex h-full flex-col rounded-[22px] border border-border bg-surface p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-blue-strong text-yellow">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <Badge tone="yellow">{way.badge}</Badge>
                </div>
                <h2 className="mt-6 text-2xl font-bold text-blue-strong">
                  {way.title}
                </h2>
                <p className="mt-3 leading-7 text-ink-muted">{way.text}</p>
                <ul className="mt-5 grid gap-2 text-sm text-blue-strong">
                  {way.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-green"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <LinkButton
                  href={way.href}
                  variant="ghost"
                  className="mt-7 w-full"
                >
                  {way.cta}
                </LinkButton>
              </article>
            );
          })}
        </div>
      </Section>

      <Section className="section-soft">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {isUk ? "Де потрібна допомога" : "Wo Hilfe gebraucht wird"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {isUk
                ? "Невеликі конкретні задачі замість розмитих обіцянок"
                : "Konkrete Aufgaben statt unklarer Verpflichtungen"}
            </h2>
            <p className="mt-4 leading-7 text-ink-muted">
              {isUk
                ? "До початку ми погоджуємо задачу, орієнтовний час, контактну особу та спосіб завершення. Членство для цього не потрібне."
                : "Vor dem Start klären wir Aufgabe, ungefähren Zeitaufwand, Ansprechperson und Abschluss. Eine Mitgliedschaft ist dafür nicht nötig."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {opportunities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[18px] border border-border bg-surface p-5 shadow-sm"
                >
                  <Icon aria-hidden="true" className="h-5 w-5 text-blue" />
                  <h3 className="mt-4 font-bold text-blue-strong">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-ink-muted">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section>
        <article className="overflow-hidden rounded-[26px] border border-border bg-blue-strong text-white shadow-soft">
          <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
            <div className="relative overflow-hidden p-7 sm:p-9">
              <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow/18" />
              <div className="relative">
                <Badge tone="yellow">{isUk ? "Пілотний воркшоп" : "Pilotworkshop"}</Badge>
                <BriefcaseBusiness
                  aria-hidden="true"
                  className="mt-12 h-10 w-10 text-yellow"
                />
                <h2 className="mt-5 text-3xl font-bold">
                  {isUk
                    ? "AI-інструменти для пошуку роботи та Bewerbung"
                    : "KI-Tools für Jobsuche und Bewerbung"}
                </h2>
                <p className="mt-4 leading-7 text-white/78">
                  {isUk
                    ? "Практичний вступ для людей з міграційним досвідом: безпечна робота з AI, пошук вакансій, CV, супровідні листи, e-mail та підготовка до співбесіди."
                    : "Praxisnaher Einstieg für Menschen mit Zuwanderungserfahrung: sichere KI-Nutzung, Stellensuche, Lebenslauf, Anschreiben, E-Mails und Gesprächsvorbereitung."}
                </p>
              </div>
            </div>
            <div className="bg-surface p-7 text-blue-strong sm:p-9">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["6 h", isUk ? "загальний обсяг" : "Gesamtumfang"],
                  ["10–15", isUk ? "учасників" : "Teilnehmende"],
                  ["MG", "Mönchengladbach"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-[16px] bg-surface-muted p-4"
                  >
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="mt-1 text-xs text-ink-muted">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm leading-6 text-ink-muted">
                {isUk
                  ? "Дату ще не оголошено. Через форму нижче можна залишити інтерес без реєстрації на конкретний день."
                  : "Ein Termin ist noch nicht veröffentlicht. Über das Formular unten kann unverbindliches Interesse gemeldet werden."}
              </p>
              <LinkButton href="#mitmachen-formular" className="mt-6">
                {isUk ? "Повідомити про інтерес" : "Interesse melden"}
              </LinkButton>
            </div>
          </div>
        </article>
      </Section>

      <Section id="membership-documents" className="section-warm">
        <div className="grid gap-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {isUk ? "Членство" : "Mitgliedschaft"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {isUk ? "Документи в одному місці" : "Alle Unterlagen an einem Ort"}
            </h2>
            <p className="mt-4 leading-7 text-ink-muted">
              {isUk
                ? "Річний внесок: 48 € звичайне членство, 120 € підтримуюче, 24 € пільгове за наявності підтвердження."
                : "Jahresbeitrag: 48 € regulär, 120 € Fördermitgliedschaft, 24 € ermäßigt mit entsprechendem Nachweis."}
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-[16px] border border-border bg-surface p-4">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-green"
              />
              <p className="text-sm leading-6 text-ink-muted">
                {isUk
                  ? "Заповнені форми містять персональні дані. Не надсилайте їх через відкриті соцмережі."
                  : "Ausgefüllte Formulare enthalten personenbezogene Daten. Bitte nicht über offene soziale Netzwerke versenden."}
              </p>
            </div>
          </div>
          <div className="grid gap-3">
            {documents.map((document) => (
              <a
                key={document.href}
                href={document.href}
                download
                className="card-surface focus-ring flex min-h-20 items-center gap-4 rounded-[16px] border border-border bg-surface p-4"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-blue-strong text-yellow">
                  <FileText aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-blue-strong">
                    {document.title}
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {document.note}
                  </span>
                </span>
                <ArrowDownToLine
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-blue"
                />
              </a>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div className="rounded-[22px] border border-border bg-surface p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {isUk ? "Проєкт підтримано" : "Projektförderung"}
            </p>
            <a
              href="https://www.deutsche-stiftung-engagement-und-ehrenamt.de/"
              target="_blank"
              rel="noreferrer"
              className="focus-ring mt-5 block rounded-[12px] bg-white p-4"
            >
              <Image
                src="/images/partners/dsee-foerderlogo.svg"
                alt="Gefördert durch Deutsche Stiftung für Engagement und Ehrenamt"
                width={560}
                height={240}
                className="h-auto w-full"
              />
            </a>
            <p className="mt-5 text-sm leading-6 text-ink-muted">
              {isUk
                ? "Нова багатомовна сторінка та залучення волонтерів реалізуються в межах проєкту «Digitale Brücken bauen» за підтримки мікрогрантової програми DSEE у 2026 році."
                : "Die neue mehrsprachige Website und die Gewinnung von Ehrenamtlichen werden 2026 im Projekt „Digitale Brücken bauen“ durch das Mikroförderprogramm der DSEE unterstützt."}
            </p>
          </div>
          <div id="mitmachen-formular" className="scroll-mt-28">
            <ContactForm
              locale={locale}
              initialTopic="volunteering"
              requestContext="volunteering"
              requestLabel={
                isUk
                  ? "Волонтерство, членство або інтерес до AI-воркшопу"
                  : "Ehrenamt, Mitgliedschaft oder Interesse am KI-Workshop"
              }
            />
          </div>
        </div>
      </Section>
    </>
  );
}
