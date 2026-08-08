import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HandHeart, History, Sparkles, UsersRound } from "lucide-react";
import { getPartners, getPeople, getSiteSettings } from "@/data/content";
import { isLocale, type Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/localize";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { PeopleGrid, PersonProfileCard } from "@/components/content/PeopleGrid";
import { PhotoCarousel } from "@/components/content/PhotoCarousel";
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
        ? "Історія, правління, викладачі, волонтери та партнери SONNENBLUME у Мьонхенгладбаху."
        : "Geschichte, Vorstand, Kursleitungen, Ehrenamtliche und Partner von SONNENBLUME in Mönchengladbach.",
  });
}

const communityPhotos = [
  {
    src: "/images/community/community-festival.jpg",
    alt: {
      uk: "Команда і гості SONNENBLUME на святі громади",
      de: "Team und Gäste von SONNENBLUME beim Gemeinschaftsfest",
    },
  },
  {
    src: "/images/community/community-gathering.jpg",
    alt: {
      uk: "Зустріч української громади у Мьонхенгладбаху",
      de: "Treffen der ukrainischen Gemeinschaft in Mönchengladbach",
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
      uk: "Хор під час музичної зустрічі SONNENBLUME",
      de: "Chor bei einer Musikveranstaltung von SONNENBLUME",
    },
  },
];

export default async function AboutPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const [settings, people, partners] = await Promise.all([
    getSiteSettings(),
    getPeople(),
    getPartners(),
  ]);
  const board = people.filter((person) => person.roles.includes("board"));
  const chair = board.find((person) => person.id === "person-natalia-petrova");
  const boardMembers = board.filter((person) => person.id !== chair?.id);
  const teachers = people.filter((person) => person.roles.includes("teacher"));
  const isUk = locale === "uk";

  return (
    <>
      <PageHeader
        eyebrow={isUk ? "Про SONNENBLUME" : "Über SONNENBLUME"}
        title={
          isUk
            ? "Українська спільнота, що стала місцем зустрічі"
            : "Eine ukrainische Gemeinschaft, die Begegnung möglich macht"
        }
        description={t(settings.description, locale)}
        visual={
          <PhotoCarousel
            images={communityPhotos}
            locale={locale}
            className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3]"
            preloadFirst
          />
        }
      >
        <Breadcrumbs
          locale={locale}
          items={[{ label: isUk ? "Про нас" : "Über uns", route: "about" }]}
        />
      </PageHeader>

      <Section>
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            {
              title: isUk ? "Наша місія" : "Unsere Mission",
              text: isUk
                ? "Зберігати українську культуру, підтримувати освіту та допомагати людям відчувати себе частиною спільноти у Мьонхенгладбаху."
                : "Ukrainische Kultur bewahren, Bildung unterstützen und Menschen in Mönchengladbach ein Gefühl von Gemeinschaft geben.",
            },
            {
              title: isUk
                ? "Для дітей і дорослих"
                : "Für Kinder und Erwachsene",
              text: isUk
                ? "Ми створюємо заняття й зустрічі, де можна навчатися, розвивати таланти, знайомитися та підтримувати одне одного."
                : "Wir schaffen Kurse und Treffen zum Lernen, zur Talentförderung, zum Kennenlernen und zur gegenseitigen Unterstützung.",
            },
            {
              title: isUk ? "Відкрита співпраця" : "Offene Zusammenarbeit",
              text: isUk
                ? "Правління, викладачі, волонтери та партнери працюють разом — кожен у своїй ролі, але з однією спільною метою."
                : "Vorstand, Kursleitungen, Ehrenamtliche und Partner arbeiten in unterschiedlichen Rollen an einem gemeinsamen Ziel.",
            },
          ].map((item) => (
            <article
              className="card-surface rounded-[20px] border border-border bg-surface p-6"
              key={item.title}
            >
              <Sparkles aria-hidden="true" className="h-6 w-6 text-yellow" />
              <h2 className="mt-5 text-2xl font-bold text-blue-strong">
                {item.title}
              </h2>
              <p className="mt-3 leading-7 text-ink-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section className="section-warm pt-0">
        <div className="history-panel grid gap-7 overflow-hidden rounded-[24px] border border-border bg-surface p-7 shadow-soft lg:grid-cols-[auto_1fr] lg:items-start lg:p-10">
          <span className="grid h-14 w-14 place-items-center rounded-[18px] bg-yellow/24 text-blue-strong">
            <History aria-hidden="true" className="h-7 w-7" />
          </span>
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {isUk ? "Як усе почалося" : "Wie alles begann"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {isUk
                ? "Від взаємної підтримки — до спільних проєктів"
                : "Von gegenseitiger Hilfe zu gemeinsamen Projekten"}
            </h2>
            <p className="mt-4 text-lg leading-8 text-ink-muted">
              {isUk
                ? "SONNENBLUME виросла з бажання українців у Мьонхенгладбаху зберігати культурний зв’язок, допомагати родинам орієнтуватися у новому середовищі та створювати для дітей і дорослих власний простір для навчання, творчості й зустрічей. Сьогодні цю ідею продовжують курси, культурні події та волонтерська робота."
                : "SONNENBLUME entstand aus dem Wunsch von Ukrainerinnen und Ukrainern in Mönchengladbach, kulturelle Verbundenheit zu bewahren, Familien beim Ankommen zu unterstützen und einen eigenen Raum für Lernen, Kreativität und Begegnung zu schaffen. Heute lebt diese Idee in Kursen, Kulturveranstaltungen und ehrenamtlicher Arbeit weiter."}
            </p>
          </div>
        </div>
      </Section>

      <Section className="section-soft">
        <div className="grid min-w-0 gap-14 lg:gap-18">
          <section
            aria-labelledby="chair-title"
            className="min-w-0 text-center"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {isUk ? "Правління" : "Vorstand"}
            </p>
            <h2
              id="chair-title"
              className="mt-3 break-words text-4xl font-bold text-blue-strong"
            >
              {isUk ? "Голова правління" : "Vorstandsvorsitzende"}
            </h2>
            {chair ? (
              <div className="mt-7">
                <PersonProfileCard
                  person={chair}
                  locale={locale}
                  featured
                  preload
                />
              </div>
            ) : null}
          </section>

          <PeopleGrid
            locale={locale}
            people={boardMembers}
            title={isUk ? "Члени правління" : "Weitere Vorstandsmitglieder"}
            description={
              isUk
                ? "Команда, що відповідає за організаційну, фінансову, комунікаційну та програмну роботу об’єднання."
                : "Das Team für organisatorische, finanzielle, kommunikative und programmbezogene Aufgaben des Vereins."
            }
          />

          <div className="min-w-0 border-t border-border/80 pt-12 lg:pt-16">
            <PeopleGrid
              locale={locale}
              people={teachers}
              title={isUk ? "Викладачі" : "Kursleitungen"}
              description={
                isUk
                  ? "Фахівці, які безпосередньо працюють з дітьми й підлітками на регулярних заняттях SONNENBLUME."
                  : "Fachkräfte, die Kinder und Jugendliche in den regelmäßigen Angeboten von SONNENBLUME begleiten."
              }
            />
          </div>
        </div>
      </Section>

      <Section className="section-warm">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-yellow/24 text-blue-strong">
            <HandHeart aria-hidden="true" className="h-7 w-7" />
          </span>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {isUk ? "Поза членством" : "Ohne Mitgliedschaft"}
          </p>
          <h2 className="mt-3 text-4xl font-bold text-blue-strong">
            {isUk
              ? "Активні волонтери поруч із нами"
              : "Aktive Ehrenamtliche an unserer Seite"}
          </h2>
          <p className="mt-5 text-lg leading-8 text-ink-muted">
            {isUk
              ? "Частину роботи підтримують люди, які не є членами об’єднання, але регулярно допомагають SONNENBLUME своїм часом і досвідом. Ми щиро цінуємо цей внесок. Імена та фотографії публікуємо лише за особистою згодою."
              : "Ein Teil unserer Arbeit wird von Menschen getragen, die keine Vereinsmitglieder sind und SONNENBLUME dennoch regelmäßig mit Zeit und Erfahrung unterstützen. Dafür sind wir sehr dankbar. Namen und Fotos veröffentlichen wir nur mit persönlicher Einwilligung."}
          </p>
          <LinkButton
            href={`${getPath(locale, "contact")}?topic=volunteering`}
            variant="ghost"
            className="mt-7"
          >
            {isUk ? "Запропонувати допомогу" : "Unterstützung anbieten"}
          </LinkButton>
        </div>
      </Section>

      <Section>
        <div className="mx-auto mb-9 max-w-4xl text-center">
          <UsersRound
            aria-hidden="true"
            className="mx-auto h-7 w-7 text-blue"
          />
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {isUk ? "Дякуємо" : "Danke"}
          </p>
          <h2 className="mt-3 text-4xl font-bold text-blue-strong">
            {isUk
              ? "Організаціям і людям, які посилюють нашу роботу"
              : "Organisationen und Menschen, die unsere Arbeit stärken"}
          </h2>
          <p className="mt-4 leading-7 text-ink-muted">
            {isUk
              ? "Ми вдячні за фінансову, організаційну й професійну підтримку, приміщення, контакти та час. Особисті імена додаємо до цієї подяки тільки з дозволу самих людей."
              : "Wir danken für finanzielle, organisatorische und fachliche Unterstützung, Räume, Kontakte und Zeit. Persönliche Namen ergänzen wir nur mit Zustimmung der jeweiligen Personen."}
          </p>
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
                  ? "Волонтерство, членство в об’єднанні та партнерство мають різні формати — оберіть той, що підходить саме вам."
                  : "Ehrenamt, Vereinsmitgliedschaft und Partnerschaft haben unterschiedliche Formen – wählen Sie, was zu Ihnen passt."}
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
