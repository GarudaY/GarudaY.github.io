"use client";

import { Download, LoaderCircle, RefreshCw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type {
  AdminContact,
  AdminRegistration,
  ContactStatus,
} from "@/types/operations";
import { Alert } from "@/components/ui/Alert";
import { Button, LinkButton } from "@/components/ui/Button";

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "de-DE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "confirmed" || status === "resolved") {
    return "bg-green/20 text-blue-strong";
  }
  if (status === "waitlist" || status === "in_progress") {
    return "bg-yellow/25 text-blue-strong";
  }
  if (status === "cancelled") return "bg-danger/10 text-danger";
  return "bg-blue/10 text-blue-strong";
}

function registrationStatusLabel(status: AdminRegistration["status"], locale: Locale) {
  const labels = {
    confirmed: { uk: "Підтверджено", de: "Bestätigt" },
    waitlist: { uk: "У черзі", de: "Warteliste" },
    cancelled: { uk: "Скасовано", de: "Storniert" },
  } as const;
  return labels[status][locale];
}

function contactStatusLabel(status: ContactStatus, locale: Locale) {
  const labels = {
    new: { uk: "Нове", de: "Neu" },
    in_progress: { uk: "В роботі", de: "In Bearbeitung" },
    resolved: { uk: "Завершено", de: "Erledigt" },
  } as const;
  return labels[status][locale];
}

function contactTopicLabel(topic: AdminContact["topic"], locale: Locale) {
  const labels = {
    courses: { uk: "курси", de: "Kurse" },
    events: { uk: "події", de: "Veranstaltungen" },
    donation: { uk: "пожертви", de: "Spenden" },
    partnership: { uk: "співпраця", de: "Partnerschaft" },
  } as const;
  return labels[topic][locale];
}

export function AdminOperations({
  locale,
  registrations,
  contacts,
}: {
  locale: Locale;
  registrations: AdminRegistration[];
  contacts: AdminContact[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const isUk = locale === "uk";

  async function update(payload: object, id: string) {
    setPendingId(id);
    setError(false);
    try {
      const response = await fetch("/api/admin/operations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("update_failed");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="grid min-w-0 gap-12">
      {error ? (
        <Alert role="alert" tone="warning">
          {isUk
            ? "Не вдалося оновити запис. Спробуйте ще раз."
            : "Der Eintrag konnte nicht aktualisiert werden. Bitte erneut versuchen."}
        </Alert>
      ) : null}

      <section className="min-w-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue">
              {registrations.length} {isUk ? "заявок" : "Anmeldungen"}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-blue-strong">
              {isUk ? "Реєстрації на події" : "Veranstaltungsanmeldungen"}
            </h2>
          </div>
          <LinkButton
            href="/api/admin/export?kind=registrations"
            variant="ghost"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            CSV
          </LinkButton>
        </div>
        <div className="mt-6 overflow-x-auto rounded-[18px] border border-border bg-surface shadow-soft">
          <table className="min-w-[980px] w-full border-collapse text-left text-sm">
            <thead className="bg-surface-muted text-blue-strong">
              <tr>
                <th className="p-4 font-semibold">{isUk ? "Заявка" : "Anmeldung"}</th>
                <th className="p-4 font-semibold">{isUk ? "Подія" : "Event"}</th>
                <th className="p-4 font-semibold">{isUk ? "Контакт" : "Kontakt"}</th>
                <th className="p-4 font-semibold">{isUk ? "Люди" : "Personen"}</th>
                <th className="p-4 font-semibold">{isUk ? "Статус" : "Status"}</th>
                <th className="p-4 font-semibold">{isUk ? "Дія" : "Aktion"}</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length ? (
                registrations.map((item) => (
                  <tr key={item.id} className="border-t border-border align-top">
                    <td className="p-4">
                      <strong className="block text-blue-strong">{item.reference}</strong>
                      <span className="mt-1 block text-xs text-ink-muted">
                        {formatDate(item.createdAt, locale)}
                      </span>
                    </td>
                    <td className="max-w-64 p-4 text-ink-muted">{item.eventTitle}</td>
                    <td className="p-4 text-ink-muted">
                      <strong className="block text-blue-strong">{item.name}</strong>
                      <a className="hover:text-blue" href={`mailto:${item.email}`}>
                        {item.email}
                      </a>
                    </td>
                    <td className="p-4 text-ink-muted">{item.participants}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                        {registrationStatusLabel(item.status, locale)}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.status !== "cancelled" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={pendingId === item.id}
                          onClick={() =>
                            update(
                              { kind: "registration", id: item.id, action: "cancel" },
                              item.id,
                            )
                          }
                        >
                          {pendingId === item.id ? (
                            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle aria-hidden="true" className="h-4 w-4" />
                          )}
                          {isUk ? "Скасувати" : "Stornieren"}
                        </Button>
                      ) : (
                        <span className="text-xs text-ink-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-muted">
                    {isUk ? "Заявок поки немає." : "Noch keine Anmeldungen."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="min-w-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue">
              {contacts.length} {isUk ? "звернень" : "Anfragen"}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-blue-strong">
              {isUk ? "Контактна черга" : "Kontakt-Warteschlange"}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="quiet" onClick={() => router.refresh()}>
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              {isUk ? "Оновити" : "Aktualisieren"}
            </Button>
            <LinkButton href="/api/admin/export?kind=contacts" variant="ghost">
              <Download aria-hidden="true" className="h-4 w-4" />
              CSV
            </LinkButton>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          {contacts.length ? (
            contacts.map((item) => (
              <article key={item.id} className="rounded-[18px] border border-border bg-surface p-5 shadow-soft">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-blue">
                      {item.reference} · {contactTopicLabel(item.topic, locale)}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-blue-strong">{item.name}</h3>
                    <a className="mt-1 inline-block text-sm text-ink-muted hover:text-blue" href={`mailto:${item.email}`}>
                      {item.email}
                    </a>
                  </div>
                  <select
                    aria-label={isUk ? "Статус звернення" : "Anfragestatus"}
                    className="focus-ring min-h-11 rounded-full border border-border bg-surface-muted px-4 text-sm font-semibold text-blue-strong"
                    value={item.status}
                    disabled={pendingId === item.id}
                    onChange={(event) =>
                      update(
                        {
                          kind: "contact",
                          id: item.id,
                          status: event.target.value as ContactStatus,
                        },
                        item.id,
                      )
                    }
                  >
                    {(["new", "in_progress", "resolved"] as const).map((status) => (
                      <option key={status} value={status}>
                        {contactStatusLabel(status, locale)}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-4 whitespace-pre-wrap leading-7 text-ink-muted">{item.message}</p>
                <p className="mt-4 text-xs text-ink-muted">
                  {formatDate(item.createdAt, locale)}
                  {item.context ? ` · ${item.context}` : ""}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-[18px] border border-border bg-surface p-8 text-center text-ink-muted shadow-soft">
              {isUk ? "Звернень поки немає." : "Noch keine Anfragen."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
