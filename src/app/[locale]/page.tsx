import { ArrowRight, HandHeart, History, Sprout } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPartners, getPeople, getSiteSettings } from "@/data/content";
import { isLocale, type Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/localize";
import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { PhotoCarousel } from "@/components/content/PhotoCarousel";
import { PartnerLogo } from "@/components/content/PartnerLogo";
import { BoardPyramid } from "@/components/content/BoardPyramid";
import { StatsSection } from "@/components/content/StatsSection";
import { VereinUpdates } from "@/components/content/VereinUpdates";
import { JsonLd } from "@/components/ui/JsonLd";
import { PersonCard } from "@/components/content/PersonCard";
import { siteConfig } from "@/config/site";

type PageProps = { params: Promise<{ locale: string }> };

async function resolveLocale(params: PageProps["params"]): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const settings = await getSiteSettings();
  return buildMetadata({
    locale,
    route: "home",
    title: t(settings.seo.title, locale),
    description: t(settings.seo.description, locale),
  });
}

export default async function HomePage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const isUk = locale === "uk";
  const [settings, people, partners] = await Promise.all([
    getSiteSettings(),
    getPeople(),
    getPartners(),
  ]);
  const board = people.filter((person) => person.roles.includes("board"));
  const chair = board.find((person) => person.boardPosition === "chair");
  const members = board.filter((person) => person.id !== chair?.id);
  const volunteers = people.filter((person) =>
    person.roles.includes("volunteer"),
  );

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: t(settings.name, locale),
          url: new URL(getPath(locale, "home"), siteConfig.baseUrl).toString(),
          email: settings.contact.email,
          telephone: settings.contact.phone,
          address: {
            "@type": "PostalAddress",
            streetAddress: t(settings.contact.address, locale),
          },
          sameAs: settings.socialLinks.map((link) => link.href),
        }}
      />
      <section className="hero-shell relative overflow-hidden">
        <Container className="grid gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-18">
          <div className="hero-content relative z-10">
            <p className="hero-badge mb-5 inline-flex items-center gap-3 rounded-full bg-yellow/24 px-4 py-2 text-sm font-semibold text-blue-strong">
              SONNENBLUME · Mönchengladbach
            </p>
            <h1 className="hero-title text-balance text-4xl font-bold leading-[1.08] text-blue-strong sm:text-6xl">
              {isUk
                ? "Українське коріння. Спільне майбутнє."
                : "Ukrainische Wurzeln. Gemeinsam Zukunft gestalten."}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-muted">
              {isUk
                ? "Ми — SONNENBLUME, міжкультурне об’єднання у Мьонхенгладбаху. Зберігаємо українську культуру, підтримуємо одне одного та створюємо простір, де українська й німецька спільноти стають ближчими."
                : "Wir sind SONNENBLUME, ein interkultureller Verein in Mönchengladbach. Wir bewahren ukrainische Kultur, unterstützen einander und schaffen einen Ort, an dem ukrainische und deutsche Gemeinschaften zusammenfinden."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <LinkButton href={getPath(locale, "join")} variant="secondary">
                {isUk
                  ? "Стати частиною спільноти"
                  : "Teil der Gemeinschaft werden"}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="#board" variant="ghost">
                {isUk ? "Познайомитися з командою" : "Unser Team kennenlernen"}
              </LinkButton>
            </div>
          </div>
          <div className="hero-visual z-10 grid gap-4">
            <PhotoCarousel
              images={[
                {
                  src: "/images/community/community-festival.jpg",
                  alt: {
                    uk: "Команда і гості SONNENBLUME на святі громади",
                    de: "Team und Gäste von SONNENBLUME beim Gemeinschaftsfest",
                  },
                },
                {
                  src: "/images/community/children-day-outdoors.jpg",
                  alt: {
                    uk: "Родини на дитячому святі SONNENBLUME",
                    de: "Familien beim Kinderfest von SONNENBLUME",
                  },
                },
                {
                  src: "/images/community/community-concert-choir-wide.jpg",
                  alt: {
                    uk: "Виступ хору SONNENBLUME",
                    de: "Auftritt des SONNENBLUME-Chors",
                  },
                },
              ]}
              locale={locale}
              className="hero-media aspect-[4/3]"
              preloadFirst
            />
            <StatsSection stats={settings.stats} locale={locale} />
          </div>
        </Container>
      </section>

      <Section id="verein" className="section-warm">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              <Sprout aria-hidden="true" className="h-5 w-5" />
              {isUk ? "Наша місія" : "Unsere Mission"}
            </span>
            <h2 className="mt-4 text-balance text-3xl font-bold text-blue-strong sm:text-4xl">
              {isUk
                ? "Зберігати своє. Бути відкритими до нового."
                : "Die eigenen Wurzeln bewahren. Offen für Neues sein."}
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink-muted">
              {isUk
                ? "Ми хочемо, щоб діти й дорослі відчували зв’язок з Україною та впевненіше будували життя в Німеччині. Через творчість, освіту і спільну справу ми знайомимо людей, ділимося досвідом та підтримуємо таланти."
                : "Kinder und Erwachsene sollen ihre Verbindung zur Ukraine bewahren und ihr Leben in Deutschland selbstbewusst gestalten können. Durch Kreativität, Bildung und gemeinsames Engagement bringen wir Menschen zusammen, teilen Erfahrungen und stärken Talente."}
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-surface p-6 sm:p-8">
            <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              <History aria-hidden="true" className="h-5 w-5" />
              {isUk ? "Як усе почалося" : "Wie alles begann"}
            </span>
            <h3 className="mt-4 text-2xl font-bold text-blue-strong">
              {isUk
                ? "Від взаємної підтримки — до спільних проєктів"
                : "Von gegenseitiger Hilfe zu gemeinsamen Projekten"}
            </h3>
            <p className="mt-4 text-base leading-7 text-ink-muted">
              {isUk
                ? "SONNENBLUME виросла з бажання українців у Мьонхенгладбаху зберігати культурний зв’язок, допомагати родинам орієнтуватися в новому середовищі та створювати власний простір для навчання, творчості й зустрічей. Сьогодні цю ідею продовжують команда, волонтери та партнери об’єднання."
                : "SONNENBLUME entstand aus dem Wunsch von Ukrainerinnen und Ukrainern in Mönchengladbach, kulturelle Verbundenheit zu bewahren, Familien beim Ankommen zu unterstützen und einen eigenen Raum für Lernen, Kreativität und Begegnung zu schaffen. Heute tragen das Team, Ehrenamtliche und Partner diese Idee weiter."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
              {(isUk
                ? ["Культура", "Освіта", "Взаємодопомога"]
                : ["Kultur", "Bildung", "Miteinander"]
              ).map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-surface-muted px-3 py-1.5 text-sm font-medium text-blue-strong"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {board.length ? (
        <Section id="board" className="section-soft scroll-mt-24">
          <BoardPyramid chair={chair} members={members} locale={locale} />
        </Section>
      ) : null}

      <Section className="section-warm">
        <div className="grid gap-7 rounded-[24px] border border-border bg-surface p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-yellow/25 text-blue-strong">
            <HandHeart aria-hidden="true" className="h-8 w-8" />
          </span>
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {isUk ? "Люди поруч" : "Menschen an unserer Seite"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {isUk
                ? "Волонтери — теж наша команда"
                : "Ehrenamtliche gehören zu unserem Team"}
            </h2>
            <p className="mt-4 text-base leading-7 text-ink-muted">
              {isUk
                ? "Поруч із членами об’єднання працюють люди, які допомагають своїм часом, знаннями й турботою. Для цього не потрібно вступати до Verein. Ми вдячні за кожен внесок і публікуємо особисті історії та фото за згодою самих волонтерів."
                : "Neben unseren Mitgliedern engagieren sich Menschen mit Zeit, Wissen und persönlichem Einsatz. Dafür ist keine Vereinsmitgliedschaft nötig. Wir schätzen jeden Beitrag und veröffentlichen persönliche Geschichten und Fotos mit Einwilligung der Ehrenamtlichen."}
            </p>
          </div>
          <LinkButton
            href={getPath(locale, "join")}
            variant="ghost"
            className="justify-self-start"
          >
            {isUk ? "Як я можу допомогти" : "So kann ich helfen"}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </LinkButton>
        </div>
      </Section>

      {volunteers.length ? (
        <Section>
          <h2 className="mb-6 text-3xl font-bold text-blue-strong">
            {isUk ? "Наші активні волонтери" : "Unsere aktiven Ehrenamtlichen"}
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {volunteers.map((person) => (
              <PersonCard key={person.id} person={person} locale={locale} />
            ))}
          </div>
        </Section>
      ) : null}

      <VereinUpdates locale={locale} />

      {partners.length > 0 ? (
      <Section id="partners">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {isUk ? "Дякуємо за підтримку" : "Danke für die Unterstützung"}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-blue-strong">
            {isUk ? "Наші партнери" : "Partner und Förderer"}
          </h2>
          <p className="mt-4 text-base leading-7 text-ink-muted">
            {isUk
              ? "Організаціям і людям, які допомагають нам приміщеннями, матеріалами, знаннями, контактами й часом. Ваша підтримка робить спільні ідеї можливими."
              : "Wir danken Organisationen und Menschen, die uns mit Räumen, Materialien, Wissen, Kontakten und Zeit unterstützen. Ihre Hilfe macht gemeinsame Ideen möglich."}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {partners.map((partner) => (
            <PartnerLogo
              key={partner.id}
              partner={partner}
              locale={locale}
              compact
            />
          ))}
        </div>
      </Section>
      ) : null}
    </>
  );
}
