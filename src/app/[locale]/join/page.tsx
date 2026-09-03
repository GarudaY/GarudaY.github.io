import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, HandHeart, Lightbulb, Sparkles } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { buildMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
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
    title: locale === "uk" ? "Волонтерство" : "Ehrenamt",
    description:
      locale === "uk"
        ? "Волонтерство у SONNENBLUME: розкажіть про свій досвід, час або ідею."
        : "Ehrenamt bei SONNENBLUME: Erzählen Sie uns von Ihrer Erfahrung, Ihrer Zeit oder Ihrer Idee.",
  });
}

export default async function JoinPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const isUk = locale === "uk";
  const qualities = isUk
    ? [
        "Надійність і готовність домовлятися про конкретне завдання",
        "Час для разової або регулярної допомоги",
        "Досвід, навичка або власна ідея, яку можна реалізувати разом",
      ]
    : [
        "Verlässlichkeit und die Bereitschaft, eine konkrete Aufgabe abzustimmen",
        "Zeit für einmalige oder regelmäßige Unterstützung",
        "Erfahrung, eine praktische Fähigkeit oder eine eigene Idee, die wir gemeinsam umsetzen können",
      ];

  return (
    <>
      <PageHeader
        eyebrow={isUk ? "Долучитися" : "Mitmachen"}
        title={isUk ? "Волонтерство" : "Ehrenamt"}
        description={
          isUk
            ? "SONNENBLUME відкрита до людей, які хочуть підтримати громаду своїм часом, досвідом або власною ідеєю. Членство в об’єднанні для цього не потрібне."
            : "SONNENBLUME freut sich über Menschen, die die Gemeinschaft mit Zeit, Erfahrung oder einer eigenen Idee unterstützen möchten. Eine Vereinsmitgliedschaft ist dafür nicht erforderlich."
        }
      >
        <Breadcrumbs
          locale={locale}
          items={[
            {
              label: isUk ? "Волонтерство" : "Ehrenamt",
              route: "join",
            },
          ]}
        />
      </PageHeader>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="card-surface rounded-[24px] border border-border bg-surface p-6 sm:p-8">
            <span className="grid h-13 w-13 place-items-center rounded-[16px] bg-blue-strong text-yellow">
              <HandHeart aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="mt-7 text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {isUk ? "Кого ми шукаємо" : "Wen wir suchen"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {isUk
                ? "Людей, яким важлива спільна справа"
                : "Menschen, denen gemeinsames Engagement wichtig ist"}
            </h2>
            <p className="mt-4 leading-7 text-ink-muted">
              {isUk
                ? "Потреби команди змінюються, тому ми не публікуємо вигаданий перелік «вакансій». Нам важливо спочатку познайомитися з вами та зрозуміти, що ми можемо зробити разом."
                : "Der Bedarf im Team verändert sich. Deshalb veröffentlichen wir keine erfundene Liste fester „Stellen“. Zuerst möchten wir Sie kennenlernen und gemeinsam herausfinden, was gerade wirklich passt."}
            </p>
            <ul className="mt-6 grid gap-3">
              {qualities.map((quality) => (
                <li
                  key={quality}
                  className="flex items-start gap-3 text-sm leading-6 text-blue-strong"
                >
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-green"
                  />
                  {quality}
                </li>
              ))}
            </ul>
          </article>

          <article className="volunteer-idea-card card-surface rounded-[24px] border border-blue/15 p-6 sm:p-8">
            <span className="grid h-13 w-13 place-items-center rounded-[16px] bg-yellow text-blue-strong">
              <Lightbulb aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="mt-7 text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {isUk ? "Запропонуйте себе" : "Bringen Sie sich ein"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {isUk
                ? "Розкажіть, що ви вмієте і чого хотіли б"
                : "Erzählen Sie uns, was Sie einbringen möchten"}
            </h2>
            <p className="mt-4 leading-7 text-ink-muted">
              {isUk
                ? "Опишіть свій досвід, зручний час і формат участі. Якщо у вас є власна ідея, напишіть і про неї — команда відповість і запропонує наступний крок."
                : "Beschreiben Sie Ihre Erfahrung, Ihre verfügbare Zeit und die Form, in der Sie helfen möchten. Wenn Sie eine eigene Idee haben, schreiben Sie auch davon – das Team meldet sich mit einem passenden nächsten Schritt."}
            </p>
            <div className="mt-8 grid gap-4 rounded-[18px] border border-white/70 bg-white/70 p-5">
              {[
                isUk
                  ? "1. Коротко представтеся"
                  : "1. Stellen Sie sich kurz vor",
                isUk
                  ? "2. Опишіть досвід або ідею"
                  : "2. Beschreiben Sie Erfahrung oder Idee",
                isUk
                  ? "3. Вкажіть, коли вам зручно"
                  : "3. Nennen Sie Ihre verfügbare Zeit",
              ].map((step) => (
                <p
                  key={step}
                  className="flex items-center gap-3 font-semibold text-blue-strong"
                >
                  <Sparkles
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-blue"
                  />
                  {step}
                </p>
              ))}
            </div>
          </article>
        </div>
      </Section>

      <Section id="mitmachen-formular" className="section-soft scroll-mt-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-7 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {isUk ? "Ваша пропозиція" : "Ihr Angebot"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-blue-strong">
              {isUk ? "Напишіть команді" : "Schreiben Sie dem Team"}
            </h2>
          </div>
          <ContactForm
            locale={locale}
            initialTopic="volunteering"
            requestContext="volunteering"
            requestLabel={isUk ? "Волонтерство" : "Ehrenamt"}
          />
        </div>
      </Section>
    </>
  );
}
