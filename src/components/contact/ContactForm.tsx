"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { apiUrl } from "@/lib/api-url";
import type { ContactReceipt, ContactTopic } from "@/types/operations";
import { Button } from "@/components/ui/Button";
import { fieldClassName, FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";

function contactError(code: string, locale: Locale) {
  const isUk = locale === "uk";
  if (code === "duplicate_contact") {
    return isUk
      ? "Таке саме повідомлення вже збережено. Не потрібно надсилати його повторно."
      : "Diese Nachricht wurde bereits gespeichert und muss nicht erneut gesendet werden.";
  }
  if (code === "rate_limited") {
    return isUk
      ? "Забагато спроб за короткий час. Спробуйте ще раз приблизно за 10 хвилин."
      : "Zu viele Versuche in kurzer Zeit. Bitte versuchen Sie es in etwa 10 Minuten erneut.";
  }
  if (code === "invalid_contact") {
    return isUk
      ? "Перевірте поля форми й спробуйте ще раз."
      : "Bitte prüfen Sie die Formularfelder und versuchen Sie es erneut.";
  }
  return isUk
    ? "Не вдалося зберегти звернення. Дані залишилися у формі — спробуйте ще раз."
    : "Die Anfrage konnte nicht gespeichert werden. Ihre Eingaben bleiben erhalten — bitte versuchen Sie es erneut.";
}

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function topicFromContext(value: string | undefined): ContactTopic | undefined {
  if (!value) return undefined;
  if (value.startsWith("course-")) return "courses";
  if (value.startsWith("event-")) return "events";
  if (["courses", "events", "donation", "partnership"].includes(value)) {
    return value as ContactTopic;
  }
  return undefined;
}

export function ContactForm({
  locale,
  initialTopic = "courses",
  requestContext,
  requestLabel,
}: {
  locale: Locale;
  initialTopic?: ContactTopic;
  requestContext?: string;
  requestLabel?: string;
}) {
  const [receipt, setReceipt] = useState<ContactReceipt | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<
    ContactTopic | undefined
  >();
  const search = useSyncExternalStore(
    subscribeToLocation,
    () => window.location.search,
    () => "",
  );
  const clientContext = new URLSearchParams(search).get("topic") ?? undefined;
  const topic =
    selectedTopic ??
    topicFromContext(requestContext ?? clientContext) ??
    initialTopic;
  const isUk = locale === "uk";

  return (
    <form
      className="form-panel grid gap-5 rounded-[18px] border border-border bg-surface p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        setPending(true);
        setError(null);
        try {
          const response = await fetch(apiUrl("/api/contact"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              locale,
              name: data.get("name"),
              email: data.get("email"),
              topic: data.get("topic"),
              message: data.get("message"),
              context: requestContext ?? clientContext,
              consent: data.get("consent") === "on",
              company: data.get("company"),
            }),
          });
          const result = (await response.json()) as
            ContactReceipt | { code?: string };
          if (!response.ok || !("reference" in result)) {
            throw new Error("code" in result ? result.code : undefined);
          }
          form.reset();
          setReceipt(result);
        } catch (submissionError) {
          setError(
            contactError(
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
        <h2 className="text-xl font-bold text-blue-strong">
          {isUk ? "Написати нам" : "Nachricht schreiben"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {isUk
            ? "Звернення зберігається у структурованій локальній черзі, де команда може змінювати його статус і експортувати список."
            : "Die Anfrage wird in einer strukturierten lokalen Warteschlange gespeichert, in der das Team Status und Export verwalten kann."}
        </p>
        {requestLabel ? (
          <p className="mt-4 rounded-[8px] bg-surface-muted p-3 text-sm text-blue-strong">
            {isUk ? "Запит стосується:" : "Anfrage zu:"}{" "}
            <strong>{requestLabel}</strong>
          </p>
        ) : null}
      </div>
      {receipt ? (
        <Alert role="status">
          <span className="flex items-start gap-3">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-green"
            />
            <span>
              {isUk
                ? `Звернення ${receipt.reference} збережено в локальній черзі. Команда побачить його в адмін-панелі.`
                : `Die Anfrage ${receipt.reference} wurde in der lokalen Warteschlange gespeichert und ist im Admin-Bereich sichtbar.`}
            </span>
          </span>
        </Alert>
      ) : null}
      {error ? (
        <Alert role="alert" tone="warning">
          {error}
        </Alert>
      ) : null}
      <div className="absolute -left-[10000px]" aria-hidden="true">
        <label htmlFor="contact-company">Company</label>
        <input
          id="contact-company"
          name="company"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <FormField label={isUk ? "Ім'я" : "Name"} htmlFor="name">
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={100}
          className={fieldClassName}
          autoComplete="name"
        />
      </FormField>
      <FormField label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          required
          type="email"
          maxLength={200}
          className={fieldClassName}
          autoComplete="email"
        />
      </FormField>
      <FormField label={isUk ? "Тема" : "Betreff"} htmlFor="topic">
        <select
          id="topic"
          name="topic"
          className={fieldClassName}
          value={topic}
          onChange={(event) =>
            setSelectedTopic(event.target.value as ContactTopic)
          }
        >
          <option value="courses">{isUk ? "Курси" : "Kurse"}</option>
          <option value="events">{isUk ? "Події" : "Veranstaltungen"}</option>
          <option value="donation">{isUk ? "Пожертви" : "Spenden"}</option>
          <option value="partnership">
            {isUk ? "Співпраця" : "Partnerschaft"}
          </option>
        </select>
      </FormField>
      <FormField label={isUk ? "Повідомлення" : "Nachricht"} htmlFor="message">
        <textarea
          id="message"
          name="message"
          required
          minLength={5}
          maxLength={3000}
          rows={5}
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
            ? "Погоджуюся на локальне збереження даних для опрацювання цього звернення."
            : "Ich stimme der lokalen Speicherung meiner Daten zur Bearbeitung dieser Anfrage zu."}
        </span>
      </label>
      <Button
        type="submit"
        disabled={pending}
        className="disabled:cursor-wait disabled:opacity-65"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : null}
        {pending
          ? isUk
            ? "Зберігаємо…"
            : "Wird gespeichert…"
          : isUk
            ? "Надіслати звернення"
            : "Anfrage speichern"}
      </Button>
    </form>
  );
}
