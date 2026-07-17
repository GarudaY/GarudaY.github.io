import {
  ArrowRight,
  HeartHandshake,
  Languages,
  UsersRound,
} from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCourses,
  getFeaturedContent,
  getFeaturedCourses,
  getNewsArticles,
  getPartners,
  getPeopleByIds,
  getSiteSettings,
  getUpcomingEvents,
} from "@/data/content";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPath } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/localize";
import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ContentImage } from "@/components/ui/ContentImage";
import { FeaturedContentList } from "@/components/content/FeaturedContentList";
import { CourseCard } from "@/components/content/CourseCard";
import { EventCard } from "@/components/content/EventCard";
import { NewsCard } from "@/components/content/NewsCard";
import { PartnerLogo } from "@/components/content/PartnerLogo";
import { StatsSection } from "@/components/content/StatsSection";
import { CTASection } from "@/components/content/CTASection";
import { JsonLd } from "@/components/ui/JsonLd";
import { siteConfig } from "@/config/site";

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
  const dict = getDictionary(locale);
  const [settings, featured, featuredCourses, courses, events, news, partners] =
    await Promise.all([
      getSiteSettings(),
      getFeaturedContent(),
      getFeaturedCourses(),
      getCourses(),
      getUpcomingEvents(),
      getNewsArticles(),
      getPartners(),
    ]);
  const allTeachers = await getPeopleByIds(
    courses.flatMap((course) => course.teacherIds),
  );

  const organizationJsonLd = {
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
  };

  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <section className="hero-shell relative overflow-hidden">
        <Container className="grid gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-18">
          <div className="hero-content relative z-10">
            <p className="hero-badge mb-5 inline-flex items-center gap-3 rounded-full bg-yellow/24 px-4 py-2 text-sm font-semibold text-blue-strong backdrop-blur-sm">
              {locale === "uk"
                ? "Демо-прототип для українського Verein"
                : "Demo-Prototyp für einen ukrainischen Verein"}
            </p>
            <h1 className="hero-title text-balance text-4xl font-bold leading-[1.06] text-blue-strong sm:text-6xl">
              {locale === "uk"
                ? "Курси, події та підтримка для українців у Німеччині"
                : "Kurse, Veranstaltungen und Unterstützung für Ukrainerinnen und Ukrainer"}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-muted">
              {t(settings.description, locale)}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href={getPath(locale, "courses")}>
                {dict.common.allCourses}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </LinkButton>
              <LinkButton href={getPath(locale, "events")} variant="ghost">
                {dict.common.allEvents}
              </LinkButton>
              <LinkButton href={getPath(locale, "donate")} variant="secondary">
                {dict.common.donate}
              </LinkButton>
            </div>
          </div>
          <div className="hero-visual z-10 grid gap-4">
            <ContentImage
              image={{
                src: "/images/generated/community-hero-v1.webp",
                alt: {
                  uk: "Зустріч української громади у світлому культурному центрі",
                  de: "Treffen der ukrainischen Community in einem hellen Kulturzentrum",
                },
              }}
              locale={locale}
              className="hero-media aspect-[4/3]"
              preload
            />
            <StatsSection stats={settings.stats} locale={locale} />
          </div>
        </Container>
      </section>

      <Section className="section-soft">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {locale === "uk" ? "Актуально" : "Aktuell"}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-blue-strong">
            {locale === "uk"
              ? "Що можна зробити зараз"
              : "Was jetzt möglich ist"}
          </h2>
        </div>
        <FeaturedContentList items={featured} locale={locale} />
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {locale === "uk" ? "Про Verein" : "Über den Verein"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {locale === "uk"
                ? "Місце для навчання, взаємодопомоги та культурного зв'язку"
                : "Ein Ort für Lernen, Hilfe und kulturelle Verbindung"}
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink-muted">
              {locale === "uk"
                ? "Сайт спроєктований для невеликої організації: швидко знайти курс, зрозуміти подію, зв'язатися, підтримати або запропонувати співпрацю."
                : "Die Website ist für einen kleinen Verein konzipiert: Kurse finden, Veranstaltungen verstehen, Kontakt aufnehmen, spenden oder Zusammenarbeit anbieten."}
            </p>
            <LinkButton
              href={getPath(locale, "about")}
              variant="ghost"
              className="mt-6"
            >
              {dict.common.learnMore}
            </LinkButton>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Languages,
                title: locale === "uk" ? "Мови" : "Sprachen",
                text:
                  locale === "uk"
                    ? "Практичні заняття для життя у Німеччині."
                    : "Praxisnahe Angebote für den Alltag.",
              },
              {
                icon: UsersRound,
                title:
                  locale === "uk" ? "Діти та родини" : "Kinder und Familien",
                text:
                  locale === "uk"
                    ? "Заняття, зустрічі та м'яка інтеграція."
                    : "Angebote, Treffen und sanfte Integration.",
              },
              {
                icon: HeartHandshake,
                title: locale === "uk" ? "Підтримка" : "Unterstützung",
                text:
                  locale === "uk"
                    ? "Прозорі пожертви й волонтерські ініціативи."
                    : "Transparente Spenden und Ehrenamt.",
              },
            ].map((item) => (
              <div
                className="card-surface rounded-[18px] border border-border bg-surface p-5"
                key={item.title}
              >
                <item.icon aria-hidden="true" className="h-8 w-8 text-blue" />
                <h3 className="mt-5 text-lg font-bold text-blue-strong">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="section-warm">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {locale === "uk" ? "Курси" : "Kurse"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {locale === "uk"
                ? "Відкриті та актуальні заняття"
                : "Offene und aktuelle Angebote"}
            </h2>
          </div>
          <LinkButton href={getPath(locale, "courses")} variant="quiet">
            {dict.common.allCourses}
          </LinkButton>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredCourses.slice(0, 3).map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              locale={locale}
              teachers={allTeachers.filter((teacher) =>
                course.teacherIds.includes(teacher.id),
              )}
            />
          ))}
        </div>
      </Section>

      <Section>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {locale === "uk" ? "Події" : "Veranstaltungen"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {locale === "uk" ? "Найближчі зустрічі" : "Nächste Treffen"}
            </h2>
          </div>
          <LinkButton href={getPath(locale, "events")} variant="quiet">
            {dict.common.allEvents}
          </LinkButton>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {events.slice(0, 3).map((event) => (
            <EventCard key={event.id} event={event} locale={locale} />
          ))}
        </div>
      </Section>

      <Section className="section-soft pb-10 lg:pb-14">
        <div>
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {locale === "uk" ? "Новини" : "Neuigkeiten"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {locale === "uk"
                ? "Останнє з життя спільноти"
                : "Neues aus der Gemeinschaft"}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {news.slice(0, 2).map((article) => (
              <NewsCard key={article.id} article={article} locale={locale} />
            ))}
          </div>

          <CTASection className="mt-8">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
                  {locale === "uk" ? "Підтримка" : "Unterstützung"}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-blue-strong">
                  {locale === "uk"
                    ? "Зробімо програми доступнішими разом"
                    : "Gemeinsam Angebote zugänglicher machen"}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
                  {locale === "uk"
                    ? "Пожертви в демо не приймаються — сторінка показує майбутній прозорий процес підтримки."
                    : "Im Demo werden keine Spenden angenommen – die Seite zeigt den künftigen transparenten Ablauf."}
                </p>
              </div>
              <LinkButton href={getPath(locale, "donate")}>
                {dict.common.donate}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </LinkButton>
            </div>
          </CTASection>
        </div>
      </Section>

      <Section className="pt-10 lg:pt-14">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {locale === "uk" ? "Партнери" : "Partner"}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-blue-strong">
            {locale === "uk"
              ? "Партнери, з якими будуємо спільноту"
              : "Partner, mit denen wir Gemeinschaft gestalten"}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {partners.map((partner) => (
            <PartnerLogo key={partner.id} partner={partner} locale={locale} />
          ))}
        </div>
      </Section>
    </>
  );
}
