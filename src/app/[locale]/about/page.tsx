import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CalendarHeart,
  HandHeart,
  Languages,
  Laptop,
  Megaphone,
  UsersRound,
} from "lucide-react";
import { getPartners, getPeople, getSiteSettings } from "@/data/content";
import { isLocale, type Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/localize";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { PeopleCarousel } from "@/components/content/PeopleCarousel";
import { PartnerLogo } from "@/components/content/PartnerLogo";
import { CTASection } from "@/components/content/CTASection";

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
    route: "about",
    title: locale === "uk" ? "Про SONNENBLUME" : "Über SONNENBLUME",
    description:
      locale === "uk"
        ? "Місія, правління, команда, зовнішні волонтери та партнери SONNENBLUME у Мьонхенгладбаху."
        : "Mission, Vorstand, Team, externe Ehrenamtliche und Partner von SONNENBLUME in Mönchengladbach.",
  });
}

export default async function AboutPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const [settings, people, partners] = await Promise.all([
    getSiteSettings(),
    getPeople(),
    getPartners(),
  ]);
  const board = people.filter((person) => person.roles.includes("board"));
  const teachers = people.filter((person) => person.roles.includes("teacher"));
  const isUk = locale === "uk";

  const volunteerAreas = [
    {
      icon: Languages,
      title: isUk ? "Переклад і супровід" : "Übersetzung & Begleitung",
      text: isUk
        ? "Допомога з мовою, орієнтацією та зрозумілою комунікацією."
        : "Hilfe bei Sprache, Orientierung und verständlicher Kommunikation.",
    },
    {
      icon: CalendarHeart,
      title: isUk ? "Події та гостинність" : "Veranstaltungen & Gastfreundschaft",
      text: isUk
        ? "Підготовка зустрічей, робота з гостями та практична допомога на місці."
        : "Vorbereitung von Treffen, Gästebetreuung und praktische Hilfe vor Ort.",
    },
    {
      icon: Megaphone,
      title: isUk ? "Комунікація" : "Kommunikation",
      text: isUk
        ? "Тексти, фото, соціальні мережі та поширення корисної інформації."
        : "Texte, Fotos, soziale Medien und Verbreitung hilfreicher Informationen.",
    },
    {
      icon: Laptop,
      title: isUk ? "Технічна допомога" : "Technische Hilfe",
      text: isUk
        ? "Сайт, цифрові інструменти та підтримка онлайн-форматів."
        : "Website, digitale Werkzeuge und Unterstützung von Online-Formaten.",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={isUk ? "Про SONNENBLUME" : "Über SONNENBLUME"}
        title={
          isUk
            ? "Спільнота, що тримається на людях"
            : "Eine Gemeinschaft, die von Menschen getragen wird"
        }
        description={t(settings.description, locale)}
      >
        <Breadcrumbs
          locale={locale}
          items={[
            {
              label: isUk ? "Про нас" : "Über uns",
              route: "about",
            },
          ]}
        />
      </PageHeader>

      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: isUk ? "Місія" : "Mission",
              text: isUk
                ? "Зберігати українську культуру, полегшувати інтеграцію та створювати місце для зустрічей і розвитку."
                : "Ukrainische Kultur bewahren, Integration erleichtern und Raum für Begegnung und Entwicklung schaffen.",
            },
            {
              title: isUk ? "Принцип" : "Prinzip",
              text: isUk
                ? "Поважна, зрозуміла й практична підтримка — незалежно від досвіду, віку чи статусу членства."
                : "Respektvolle, verständliche und praktische Unterstützung – unabhängig von Erfahrung, Alter oder Mitgliedsstatus.",
            },
            {
              title: isUk ? "Формат" : "Format",
              text: isUk
                ? "Verein, викладачі, партнери та зовнішні волонтери працюють разом, але мають чітко різні ролі."
                : "Verein, Kursleitungen, Partner und externe Ehrenamtliche arbeiten zusammen – mit klar unterscheidbaren Rollen.",
            },
          ].map((item) => (
            <div
              className="card-surface rounded-[18px] border border-border bg-surface p-6"
              key={item.title}
            >
              <h2 className="text-2xl font-bold text-blue-strong">
                {item.title}
              </h2>
              <p className="mt-3 leading-7 text-ink-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="section-soft">
        <div className="mb-9 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {isUk ? "Люди в організації" : "Menschen im Verein"}
          </p>
          <h2 className="mt-3 text-4xl font-bold text-blue-strong">
            {isUk
              ? "Відповідальність і робота з програмами"
              : "Verantwortung und Programmarbeit"}
          </h2>
          <p className="mt-4 leading-7 text-ink-muted">
            {isUk
              ? "Окремо показуємо правління та людей, які безпосередньо ведуть програми. Символічні фото замінюються персональними лише за згодою."
              : "Vorstand und Menschen in der direkten Programmarbeit werden getrennt gezeigt. Symbolische Bilder werden nur mit Einwilligung durch persönliche Fotos ersetzt."}
          </p>
        </div>
        <div className="grid min-w-0 gap-14 lg:gap-18">
          <PeopleCarousel
            locale={locale}
            people={board}
            preloadFirst
            title={isUk ? "Правління" : "Vorstand"}
            description={
              isUk
                ? "Офіційна організаційна, фінансова та представницька відповідальність Verein."
                : "Offizielle organisatorische, finanzielle und vertretungsbezogene Verantwortung des Vereins."
            }
          />
          <div className="min-w-0 border-t border-border/80 pt-12 lg:pt-16">
            <PeopleCarousel
              locale={locale}
              people={teachers}
              title={isUk ? "Викладачі та керівники програм" : "Kurs- und Programmleitungen"}
              description={
                isUk
                  ? "Люди, які працюють з учасниками мовних, дитячих, творчих та інтеграційних програм."
                  : "Menschen, die Teilnehmende in Sprach-, Kinder-, Kreativ- und Integrationsangeboten begleiten."
              }
            />
          </div>
        </div>
      </Section>

      <Section className="section-warm">
        <div className="grid gap-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {isUk ? "Поза членством" : "Ohne Mitgliedschaft"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {isUk
                ? "Активні зовнішні волонтери"
                : "Aktive externe Ehrenamtliche"}
            </h2>
            <p className="mt-4 leading-7 text-ink-muted">
              {isUk
                ? "Допомагати SONNENBLUME можна без вступу до Verein. Ця група не є правлінням або штатною командою, але її внесок критично важливий."
                : "Man kann SONNENBLUME unterstützen, ohne Vereinsmitglied zu werden. Diese Gruppe gehört nicht zum Vorstand oder festen Team, ihr Beitrag ist dennoch unverzichtbar."}
            </p>
            <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-yellow/24 px-4 py-2 text-sm font-semibold text-blue-strong">
              <HandHeart aria-hidden="true" className="h-4 w-4" />
              {isUk ? "Імена — лише за згодою" : "Namen nur mit Einwilligung"}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {volunteerAreas.map((area) => {
              const Icon = area.icon;
              return (
                <article
                  key={area.title}
                  className="card-surface rounded-[18px] border border-border bg-surface p-6"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-blue-strong text-yellow">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-blue-strong">
                    {area.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {area.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </Section>

      <Section>
        <div className="mb-9 grid gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {isUk ? "Дякуємо" : "Danke"}
            </p>
            <h2 className="mt-3 text-4xl font-bold text-blue-strong">
              {isUk
                ? "Організаціям і людям, які підсилюють нашу роботу"
                : "Organisationen und Menschen, die unsere Arbeit stärken"}
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-ink-muted">
              {isUk
                ? "Тут ми окремо відзначаємо інституційних партнерів і всіх людей, які допомагають часом, знаннями, контактами, приміщенням або добрим словом."
                : "Hier würdigen wir institutionelle Partner und alle Menschen, die Zeit, Wissen, Kontakte, Räume oder ganz praktische Hilfe einbringen."}
            </p>
          </div>
          <div className="rounded-[18px] border border-yellow/55 bg-yellow/14 p-5">
            <div className="flex items-start gap-3">
              <UsersRound
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-blue"
              />
              <p className="text-sm leading-6 text-blue-strong">
                {isUk
                  ? "Особиста подяка не залежить від членства. Персональні імена та фото публікуємо тільки з дозволу самої людини."
                  : "Persönlicher Dank ist nicht an eine Mitgliedschaft gebunden. Namen und Fotos veröffentlichen wir nur mit Zustimmung der jeweiligen Person."}
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => (
            <PartnerLogo key={partner.id} partner={partner} locale={locale} />
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <CTASection>
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
            <div>
              <h2 className="text-2xl font-bold text-blue-strong">
                {isUk
                  ? "Хочете долучитися у зручному форматі?"
                  : "Möchten Sie sich passend zu Ihrer Zeit einbringen?"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                {isUk
                  ? "На сторінці «Долучитися» чітко розділені волонтерство без членства, вступ до Verein та партнерство."
                  : "Auf der Mitmachen-Seite sind Ehrenamt ohne Mitgliedschaft, Vereinsbeitritt und Partnerschaft klar getrennt."}
              </p>
            </div>
            <LinkButton href={getPath(locale, "join")}>
              {isUk ? "Обрати формат" : "Mitmach-Form wählen"}
            </LinkButton>
          </div>
        </CTASection>
      </Section>
    </>
  );
}
