import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    title: locale === "uk" ? "Про нас" : "Über uns",
    description:
      locale === "uk"
        ? "Місія, команда, напрями роботи та партнери українського Verein у Німеччині."
        : "Mission, Team, Arbeitsfelder und Partner eines ukrainischen Vereins in Deutschland.",
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

  return (
    <>
      <PageHeader
        eyebrow={locale === "uk" ? "Про Verein" : "Über den Verein"}
        title={
          locale === "uk"
            ? "Українська спільнота з практичною підтримкою"
            : "Ukrainische Community mit praktischer Unterstützung"
        }
        description={t(settings.description, locale)}
      >
        <Breadcrumbs
          locale={locale}
          items={[
            { label: locale === "uk" ? "Про нас" : "Über uns", route: "about" },
          ]}
        />
      </PageHeader>

      <Section>
        <div className="grid gap-8 lg:grid-cols-3">
          {[
            {
              title: locale === "uk" ? "Місія" : "Mission",
              text:
                locale === "uk"
                  ? "Створити зрозумілий простір для навчання, зустрічей і взаємопідтримки українців у Німеччині."
                  : "Einen verständlichen Raum für Lernen, Begegnung und Unterstützung schaffen.",
            },
            {
              title: locale === "uk" ? "Цінності" : "Werte",
              text:
                locale === "uk"
                  ? "Гідність, прозорість, доступність, повага до різного досвіду та практична користь."
                  : "Würde, Transparenz, Zugänglichkeit, Respekt und praktische Wirkung.",
            },
            {
              title: locale === "uk" ? "Формат" : "Format",
              text:
                locale === "uk"
                  ? "Невеликий Verein з курсами, подіями, партнерствами та волонтерськими ініціативами."
                  : "Kleiner Verein mit Kursen, Veranstaltungen, Partnerschaften und Ehrenamt.",
            },
          ].map((item) => (
            <div
              className="rounded-[8px] border border-border bg-surface p-6"
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
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {locale === "uk" ? "Команда" : "Team"}
          </p>
          <h2 className="mt-3 text-4xl font-bold text-blue-strong">
            {locale === "uk"
              ? "Люди, які відповідають за напрям"
              : "Menschen, die Verantwortung übernehmen"}
          </h2>
          <p className="mt-4 leading-7 text-ink-muted">
            {locale === "uk"
              ? "Два окремі блоки допомагають швидко зрозуміти, хто керує Verein і хто безпосередньо працює з учасниками програм. Профілі та зображення є demo-даними."
              : "Zwei getrennte Bereiche zeigen, wer den Verein leitet und wer direkt mit den Teilnehmenden arbeitet. Profile und Bilder sind Demo-Daten."}
          </p>
        </div>
        <div className="grid min-w-0 gap-14 lg:gap-18">
          <PeopleCarousel
            locale={locale}
            people={board}
            preloadFirst
            title={locale === "uk" ? "Правління" : "Vorstand"}
            description={
              locale === "uk"
                ? "Стратегія, партнерства, фінансова та організаційна відповідальність Verein."
                : "Strategie, Partnerschaften sowie finanzielle und organisatorische Verantwortung des Vereins."
            }
          />
          <div className="min-w-0 border-t border-border/80 pt-12 lg:pt-16">
            <PeopleCarousel
              locale={locale}
              people={teachers}
              title={locale === "uk" ? "Викладачі" : "Dozentinnen und Dozenten"}
              description={
                locale === "uk"
                  ? "Люди, які ведуть мовні, дитячі та творчі заняття й залишаються на зв'язку з учасниками."
                  : "Menschen, die Sprach-, Kinder- und Kreativangebote durchführen und die Teilnehmenden begleiten."
              }
            />
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {locale === "uk" ? "Партнери" : "Partner"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {locale === "uk"
                ? "Майбутній простір для співпраці"
                : "Künftiger Raum für Zusammenarbeit"}
            </h2>
            <p className="mt-4 leading-7 text-ink-muted">
              {locale === "uk"
                ? "Партнерські логотипи і контакти підготовлені як окрема модель, щоб редактор міг підтримувати їх без зміни коду."
                : "Partnerlogos und Kontakte sind als eigenes Modell vorbereitet, damit Redakteure sie ohne Code pflegen können."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {partners.map((partner) => (
              <PartnerLogo key={partner.id} partner={partner} locale={locale} />
            ))}
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <CTASection>
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
            <div>
              <h2 className="text-2xl font-bold text-blue-strong">
                {locale === "uk"
                  ? "Хочете співпрацювати або допомогти?"
                  : "Möchten Sie mitarbeiten oder unterstützen?"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                {locale === "uk"
                  ? "Для партнерів, волонтерів і нових учасників найкоротший шлях зараз — сторінка контактів."
                  : "Für Partner, Freiwillige und neue Mitglieder ist der kürzeste Weg aktuell die Kontaktseite."}
              </p>
            </div>
            <LinkButton href={getPath(locale, "contact")}>
              {locale === "uk" ? "Перейти до контактів" : "Zum Kontakt"}
            </LinkButton>
          </div>
        </CTASection>
      </Section>
    </>
  );
}
