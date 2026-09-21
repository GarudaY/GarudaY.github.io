"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  CalendarHeart,
  Camera,
  Check,
  HeartHandshake,
  Languages,
  Lightbulb,
  ListChecks,
  MapPin,
  Clock3,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { VolunteerOpportunity } from "@/types/content";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/contact/ContactForm";
import { cn } from "@/lib/cn";

const icons = {
  calendar: CalendarHeart,
  camera: Camera,
  languages: Languages,
  list: ListChecks,
  heart: HeartHandshake,
};

export function VolunteerOpportunities({
  locale,
  roles,
}: {
  locale: Locale;
  roles: VolunteerOpportunity[];
}) {
  const isUk = locale === "uk";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const selected = roles.find((role) => role.id === selectedId);

  function chooseRole(id: string | null) {
    setSelectedId(id);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="name"]')
        ?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
      <div>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {isUk ? "Волонтерські вакансії" : "Ehrenamtliche Aufgaben"}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-blue-strong">
            {isUk ? "Знайдіть свою справу" : "Finden Sie Ihre Aufgabe"}
          </h2>
          <p className="mt-3 text-base leading-7 text-ink-muted">
            {isUk
              ? "Кілька способів допомогти SONNENBLUME. Оберіть напрям — конкретне завдання й зручний час узгодимо разом."
              : "So können Sie SONNENBLUME unterstützen. Wählen Sie einen Bereich – die konkrete Aufgabe und passende Zeiten stimmen wir gemeinsam ab."}
          </p>
        </div>
        <div className="grid gap-4">
          {roles.map((role) => {
            const active = selectedId === role.id;
            const Icon = icons[role.icon];
            return (
              <article
                key={role.id}
                className={cn(
                  "volunteer-role-card rounded-[22px] border bg-surface p-5 sm:p-6",
                  active ? "border-blue/50 shadow-soft" : "border-border",
                )}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-[15px]",
                      active
                        ? "bg-blue-strong text-yellow"
                        : "bg-surface-muted text-blue",
                    )}
                  >
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <h3 className="self-center text-xl font-bold leading-snug text-blue-strong">
                    {role.title[locale]}
                  </h3>
                </div>
                <p className="mt-4 text-base leading-7 text-ink-muted">
                  {role.description[locale]}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 aria-hidden="true" className="h-4 w-4 text-blue" />
                    {role.time[locale]}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin aria-hidden="true" className="h-4 w-4 text-blue" />
                    {role.location[locale]}
                  </span>
                </div>
                <Button
                  type="button"
                  variant={active ? "primary" : "ghost"}
                  aria-pressed={active}
                  aria-controls="volunteer-form"
                  onClick={() => chooseRole(role.id)}
                  className="mt-5"
                >
                  {active ? <Check aria-hidden="true" className="h-4 w-4" /> : null}
                  {active
                    ? isUk
                      ? "Обрано"
                      : "Ausgewählt"
                    : isUk
                      ? "Хочу допомогти"
                      : "Hier möchte ich helfen"}
                  {!active ? <ArrowRight aria-hidden="true" className="h-4 w-4" /> : null}
                </Button>
              </article>
            );
          })}
          {!roles.length ? (
            <p className="rounded-[22px] border border-border bg-surface p-6 text-base leading-7 text-ink-muted">
              {isUk
                ? "Зараз відкритих волонтерських завдань немає. Розкажіть нам, як ви хотіли б допомогти."
                : "Zurzeit sind keine ehrenamtlichen Aufgaben ausgeschrieben. Erzählen Sie uns, wie Sie helfen möchten."}
            </p>
          ) : null}
        </div>
      </div>
      <div
        ref={formRef}
        id="volunteer-form"
        className="min-w-0 scroll-mt-28 lg:sticky lg:top-28"
      >
        <div className="mb-5 rounded-[22px] border border-yellow/45 bg-yellow/15 p-5 sm:p-6">
          <Lightbulb aria-hidden="true" className="h-6 w-6 text-blue" />
          <h2 className="mt-3 text-2xl font-bold text-blue-strong">
            {isUk ? "Маєте іншу ідею?" : "Sie haben eine andere Idee?"}
          </h2>
          <p className="mt-3 text-base leading-7 text-ink-muted">
            {isUk
              ? "Якщо жоден напрям не підходить — розкажіть про себе, свої навички та те, що хотіли б зробити разом із нами."
              : "Keine passende Aufgabe dabei? Erzählen Sie uns von sich, Ihren Fähigkeiten und dem, was Sie gern mit uns umsetzen möchten."}
          </p>
          {selected ? (
            <button
              type="button"
              onClick={() => chooseRole(null)}
              className="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-semibold text-blue"
            >
              {isUk ? "Запропонувати власну ідею" : "Eigene Idee vorschlagen"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <ContactForm
          locale={locale}
          fixedTopic="volunteering"
          initialTopic="volunteering"
          requestContext={
            selected ? "volunteering-" + selected.id : "volunteering-own-idea"
          }
          requestLabel={
            selected?.title[locale] ??
            (isUk ? "Власна ініціатива" : "Eigene Initiative")
          }
          title={isUk ? "Познайоммося" : "Lernen wir uns kennen"}
          description={
            isUk
              ? "Залиште контакти та кілька слів про себе. Команда зв’яжеться з вами, щоб обговорити наступний крок."
              : "Hinterlassen Sie Ihre Kontaktdaten und ein paar Worte über sich. Unser Team meldet sich, um den nächsten Schritt zu besprechen."
          }
          messageLabel={
            isUk ? "Про себе та вашу пропозицію" : "Über Sie und Ihren Vorschlag"
          }
          messagePlaceholder={
            isUk
              ? "Що ви вмієте, чим хочете допомогти та коли маєте час? Досвід, інтереси або власна ідея — розкажіть те, що вважаєте важливим."
              : "Was können Sie, wie möchten Sie helfen und wann haben Sie Zeit? Erzählen Sie von Ihren Erfahrungen, Interessen oder Ihrer eigenen Idee."
          }
        />
      </div>
    </div>
  );
}
