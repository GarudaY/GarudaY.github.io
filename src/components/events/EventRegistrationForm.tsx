"use client";

import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock3,
  ListChecks,
  LoaderCircle,
  UsersRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { RegistrationReceipt } from "@/types/operations";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { fieldClassName, FormField } from "@/components/ui/FormField";

type EventRegistrationFormProps = {
  locale: Locale;
  eventSlug: string;
  eventTitle: string;
  capacity: number;
  seatsAvailable: number;
};

function errorMessage(code: string, locale: Locale) {
  const isUk = locale === "uk";
  if (code === "duplicate_registration") {
    return isUk
      ? "Для цієї email-адреси вже є активна заявка на подію. Скасувати її можна за посиланням із попереднього підтвердження."
      : "Für diese E-Mail-Adresse gibt es bereits eine aktive Anmeldung. Sie kann über den Link aus der vorherigen Bestätigung storniert werden.";
  }
  if (code === "rate_limited") {
    return isUk
      ? "Забагато спроб за короткий час. Спробуйте ще раз приблизно за 10 хвилин."
      : "Zu viele Versuche in kurzer Zeit. Bitte versuchen Sie es in etwa 10 Minuten erneut.";
  }
  if (code === "event_unavailable") {
    return isUk
      ? "Реєстрація на цю подію вже недоступна."
      : "Die Anmeldung für diese Veranstaltung ist nicht mehr verfügbar.";
  }
  if (code === "invalid_registration") {
    return isUk
      ? "Перевірте заповнені поля й спробуйте ще раз."
      : "Bitte prüfen Sie die ausgefüllten Felder und versuchen Sie es erneut.";
  }
  return isUk
    ? "Не вдалося зберегти заявку. Дані не втрачено — спробуйте ще раз."
    : "Die Anmeldung konnte nicht gespeichert werden. Ihre Eingaben bleiben erhalten — bitte versuchen Sie es erneut.";
}

export function EventRegistrationForm({
  locale,
  eventSlug,
  eventTitle,
  capacity,
  seatsAvailable,
}: EventRegistrationFormProps) {
  const [confirmation, setConfirmation] =
    useState<RegistrationReceipt | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const isUk = locale === "uk";

  useEffect(() => {
    if (!confirmation) return;
    confirmationRef.current?.focus();
    confirmationRef.current?.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [confirmation]);

  return (
    <div className="overflow-hidden rounded-[18px] border border-border bg-surface shadow-soft">
      <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
        <div className="bg-blue-strong p-6 text-white sm:p-8 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-yellow">
            {isUk ? "Онлайн-реєстрація" : "Online-Anmeldung"}
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            {isUk
              ? "Місце без листування"
              : "Ein Platz ohne E-Mail-Pingpong"}
          </h2>
          <p className="mt-4 leading-7 text-white/78">
            {isUk
              ? "Заявка одразу потрапляє до структурованого локального списку. Організатор бачить кількість людей, статус і примітки в одному місці."
              : "Die Anmeldung landet direkt in einer strukturierten lokalen Liste. Anzahl, Status und Hinweise sind zentral sichtbar."}
          </p>

          <div className="mt-7 rounded-[12px] bg-white/10 p-4">
            <p className="font-semibold text-white">{eventTitle}</p>
            <p className="mt-1 text-sm text-white/75">
              {isUk
                ? `${seatsAvailable} із ${capacity} стартових вільних місць`
                : `${seatsAvailable} von ${capacity} Plätzen sind anfangs frei`}
            </p>
          </div>

          <ol className="mt-7 grid gap-5 text-sm leading-6 text-white/82">
            <li className="flex gap-3">
              <ListChecks
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-yellow"
              />
              <span>
                {isUk
                  ? "Одна структурована заявка замість вільного тексту в листі."
                  : "Eine strukturierte Anmeldung statt Freitext per E-Mail."}
              </span>
            </li>
            <li className="flex gap-3">
              <UsersRound
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-yellow"
              />
              <span>
                {isUk
                  ? "Коли місць бракує, система автоматично додає групу до списку очікування."
                  : "Wenn Plätze fehlen, wird die Gruppe automatisch auf die Warteliste gesetzt."}
              </span>
            </li>
            <li className="flex gap-3">
              <Bell
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-yellow"
              />
              <span>
                {isUk
                  ? "Після заповнення ви отримаєте номер і приватне посилання для скасування."
                  : "Danach erhalten Sie eine Nummer und einen privaten Stornierungslink."}
              </span>
            </li>
          </ol>
        </div>

        <div id="event-registration" className="scroll-mt-28 p-6 sm:p-8 lg:p-10">
          {confirmation ? (
            <div
              ref={confirmationRef}
              role="status"
              tabIndex={-1}
              className="flex min-h-full flex-col justify-center focus:outline-none"
            >
              {confirmation.status === "confirmed" ? (
                <CheckCircle2
                  aria-hidden="true"
                  className="h-12 w-12 text-green"
                />
              ) : (
                <Clock3 aria-hidden="true" className="h-12 w-12 text-yellow" />
              )}
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.12em] text-blue">
                {confirmation.reference}
              </p>
              <h2 className="mt-2 text-3xl font-bold text-blue-strong">
                {confirmation.status === "confirmed"
                  ? isUk
                    ? "Місце зарезервовано"
                    : "Platz reserviert"
                  : isUk
                    ? "Ви у списку очікування"
                    : "Sie stehen auf der Warteliste"}
              </h2>
              <p className="mt-4 leading-7 text-ink-muted">
                {isUk
                  ? `Кількість учасників: ${confirmation.participants}. Після заявки залишилося ${confirmation.remainingSeats} вільних місць.`
                  : `Personenzahl: ${confirmation.participants}. Nach der Anmeldung sind ${confirmation.remainingSeats} Plätze frei.`}
              </p>
              <Alert className="mt-6">
                {isUk
                  ? "Заявка збережена лише на цьому сервері. Поштова служба не підключена, тому обов'язково збережіть приватне посилання для перегляду або скасування."
                  : "Die Anmeldung wurde nur auf diesem Server gespeichert. Da kein E-Mail-Dienst verbunden ist, speichern Sie bitte den privaten Status- und Stornierungslink."}
              </Alert>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={confirmation.cancellationPath}
                  className="button-motion focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-blue-strong px-5 py-2.5 text-sm font-semibold text-white"
                >
                  {isUk ? "Статус і скасування" : "Status und Stornierung"}
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setConfirmation(null);
                    setError(null);
                  }}
                >
                  {isUk ? "Нова заявка" : "Neue Anmeldung"}
                </Button>
              </div>
            </div>
          ) : (
            <form
              className="grid gap-5"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const data = new FormData(form);
                setPending(true);
                setError(null);
                try {
                  const response = await fetch("/api/registrations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      locale,
                      eventSlug,
                      name: data.get("name"),
                      email: data.get("email"),
                      participants: data.get("participants"),
                      group: data.get("group"),
                      note: data.get("note"),
                      consent: data.get("consent") === "on",
                      company: data.get("company"),
                    }),
                  });
                  const result = (await response.json()) as
                    | RegistrationReceipt
                    | { code?: string };
                  if (!response.ok || !("reference" in result)) {
                    throw new Error("code" in result ? result.code : undefined);
                  }
                  form.reset();
                  setConfirmation(result);
                  window.dispatchEvent(new Event("registration:changed"));
                } catch (submissionError) {
                  setError(
                    errorMessage(
                      submissionError instanceof Error
                        ? submissionError.message
                        : "storage_unavailable",
                      locale,
                    ),
                  );
                } finally {
                  setPending(false);
                }
              }}
            >
              <div>
                <h2 className="text-2xl font-bold text-blue-strong">
                  {isUk ? "Дані для участі" : "Angaben zur Teilnahme"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  {isUk
                    ? "Поля підібрані так, щоб команді не довелося уточнювати базову інформацію вручну."
                    : "Die Felder vermeiden Rückfragen und geben dem Team alle grundlegenden Informationen."}
                </p>
              </div>

              {error ? (
                <Alert role="alert" tone="warning">
                  {error}
                </Alert>
              ) : null}
              <div className="absolute -left-[10000px]" aria-hidden="true">
                <label htmlFor="registration-company">Company</label>
                <input
                  id="registration-company"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <FormField
                label={isUk ? "Ім'я та прізвище" : "Vor- und Nachname"}
                htmlFor="registration-name"
              >
                <input
                  id="registration-name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  className={fieldClassName}
                />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Email" htmlFor="registration-email">
                  <input
                    id="registration-email"
                    name="email"
                    required
                    type="email"
                    maxLength={200}
                    autoComplete="email"
                    className={fieldClassName}
                  />
                </FormField>
                <FormField
                  label={isUk ? "Кількість учасників" : "Personenzahl"}
                  htmlFor="registration-participants"
                >
                  <select
                    id="registration-participants"
                    name="participants"
                    defaultValue="1"
                    className={fieldClassName}
                  >
                    {[1, 2, 3, 4, 5].map((number) => (
                      <option value={number} key={number}>
                        {number}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              <FormField
                label={isUk ? "Хто бере участь" : "Wer nimmt teil?"}
                htmlFor="registration-group"
              >
                <select
                  id="registration-group"
                  name="group"
                  defaultValue="adults"
                  className={fieldClassName}
                >
                  <option value="adults">
                    {isUk ? "Дорослі" : "Erwachsene"}
                  </option>
                  <option value="family">
                    {isUk ? "Дорослі та діти" : "Erwachsene und Kinder"}
                  </option>
                  <option value="children">
                    {isUk ? "Діти з супроводом" : "Kinder mit Begleitung"}
                  </option>
                </select>
              </FormField>
              <FormField
                label={
                  isUk
                    ? "Що варто знати організаторам?"
                    : "Was sollte das Team wissen?"
                }
                htmlFor="registration-note"
                hint={
                  isUk
                    ? "Необов'язково: доступність, алергії або інша важлива примітка."
                    : "Optional: Barrierefreiheit, Allergien oder ein anderer wichtiger Hinweis."
                }
              >
                <textarea
                  id="registration-note"
                  name="note"
                  rows={3}
                  maxLength={1000}
                  className={fieldClassName}
                />
              </FormField>
              <label className="flex min-h-11 items-start gap-3 text-sm leading-6 text-ink-muted">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  className="mt-1.5 h-5 w-5 shrink-0 accent-blue"
                />
                <span>
                  {isUk
                    ? "Погоджуюся на локальне збереження даних для організації цієї події. Заявку можна скасувати за приватним посиланням."
                    : "Ich stimme der lokalen Datenspeicherung zur Organisation dieser Veranstaltung zu. Die Anmeldung kann über einen privaten Link storniert werden."}
                </span>
              </label>
              <Button
                type="submit"
                disabled={pending}
                className="w-full disabled:cursor-wait disabled:opacity-65 sm:w-auto sm:justify-self-start"
              >
                {pending ? (
                  <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : null}
                {pending
                  ? isUk
                    ? "Зберігаємо…"
                    : "Wird gespeichert…"
                  : isUk
                    ? "Зареєструватися"
                    : "Jetzt anmelden"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
