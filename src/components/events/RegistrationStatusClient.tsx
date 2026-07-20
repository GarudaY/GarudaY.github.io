"use client";

import Link from "next/link";
import { CalendarCheck2, Hash, LoaderCircle, UsersRound } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { apiUrl } from "@/lib/api-url";
import type { RegistrationStatus } from "@/types/operations";
import { CancelRegistrationButton } from "@/components/events/CancelRegistrationButton";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

type StatusDetails = {
  reference: string;
  eventSlug: string;
  eventTitle: string;
  participants: number;
  status: RegistrationStatus;
  createdAt: string;
};

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

export function RegistrationStatusClient({ locale }: { locale: Locale }) {
  const [registration, setRegistration] = useState<StatusDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const search = useSyncExternalStore(
    subscribeToLocation,
    () => window.location.search,
    () => "",
  );
  const token = new URLSearchParams(search).get("token") ?? "";
  const validToken = /^[a-f0-9]{64}$/.test(token);
  const isUk = locale === "uk";

  useEffect(() => {
    if (!validToken) return;

    const controller = new AbortController();
    fetch(apiUrl(`/api/registrations/${token}?client=github-pages`), {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("registration_not_found");
        return (await response.json()) as StatusDetails;
      })
      .then(setRegistration)
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        )
          return;
        setError(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [token, validToken]);

  if (!validToken) {
    return (
      <Card className="p-6 sm:p-8">
        <Alert role="alert" tone="warning">
          {isUk
            ? "Посилання недійсне або заявка більше недоступна. Перевірте, чи адреса скопійована повністю."
            : "Der Link ist ungültig oder die Anmeldung ist nicht mehr verfügbar. Bitte prüfen Sie, ob die Adresse vollständig kopiert wurde."}
        </Alert>
        <Link
          href={getPath(locale, "events")}
          className="focus-ring mt-5 inline-flex min-h-11 items-center font-semibold text-blue hover:underline"
        >
          {isUk ? "Перейти до подій" : "Zu den Veranstaltungen"}
        </Link>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="grid min-h-52 place-items-center p-8">
        <span
          role="status"
          className="flex items-center gap-3 font-semibold text-blue-strong"
        >
          <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
          {isUk ? "Завантажуємо статус…" : "Status wird geladen…"}
        </span>
      </Card>
    );
  }

  if (error || !registration) {
    return (
      <Card className="p-6 sm:p-8">
        <Alert role="alert" tone="warning">
          {isUk
            ? "Посилання недійсне або заявка більше недоступна. Перевірте, чи адреса скопійована повністю."
            : "Der Link ist ungültig oder die Anmeldung ist nicht mehr verfügbar. Bitte prüfen Sie, ob die Adresse vollständig kopiert wurde."}
        </Alert>
        <Link
          href={getPath(locale, "events")}
          className="focus-ring mt-5 inline-flex min-h-11 items-center font-semibold text-blue hover:underline"
        >
          {isUk ? "Перейти до подій" : "Zu den Veranstaltungen"}
        </Link>
      </Card>
    );
  }

  const statusLabel =
    registration.status === "confirmed"
      ? isUk
        ? "Підтверджено"
        : "Bestätigt"
      : registration.status === "waitlist"
        ? isUk
          ? "Список очікування"
          : "Warteliste"
        : isUk
          ? "Скасовано"
          : "Storniert";

  return (
    <Card className="p-6 sm:p-8">
      <span
        className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${
          registration.status === "confirmed"
            ? "bg-green/20 text-blue-strong"
            : registration.status === "waitlist"
              ? "bg-yellow/25 text-blue-strong"
              : "bg-danger/10 text-danger"
        }`}
      >
        {statusLabel}
      </span>
      <h2 className="mt-5 text-3xl font-bold text-blue-strong">
        {registration.eventTitle}
      </h2>
      <dl className="mt-7 grid gap-4 text-sm text-ink-muted sm:grid-cols-2">
        <div className="flex gap-3 rounded-[12px] bg-surface-muted p-4">
          <Hash aria-hidden="true" className="h-5 w-5 shrink-0 text-blue" />
          <div>
            <dt className="font-semibold text-blue-strong">
              {isUk ? "Номер" : "Nummer"}
            </dt>
            <dd>{registration.reference}</dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-[12px] bg-surface-muted p-4">
          <UsersRound
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-blue"
          />
          <div>
            <dt className="font-semibold text-blue-strong">
              {isUk ? "Учасники" : "Personen"}
            </dt>
            <dd>{registration.participants}</dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-[12px] bg-surface-muted p-4 sm:col-span-2">
          <CalendarCheck2
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-blue"
          />
          <div>
            <dt className="font-semibold text-blue-strong">
              {isUk ? "Створено" : "Erstellt"}
            </dt>
            <dd>
              {new Intl.DateTimeFormat(isUk ? "uk-UA" : "de-DE", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Europe/Berlin",
              }).format(new Date(registration.createdAt))}
            </dd>
          </div>
        </div>
      </dl>
      <CancelRegistrationButton
        token={token}
        locale={locale}
        initialStatus={registration.status}
        onCancelled={() =>
          setRegistration((current) =>
            current ? { ...current, status: "cancelled" } : current,
          )
        }
      />
      <Link
        href={getPath(locale, "events", registration.eventSlug)}
        className="focus-ring mt-5 inline-flex min-h-11 items-center font-semibold text-blue hover:underline"
      >
        {isUk ? "Повернутися до події" : "Zur Veranstaltung"}
      </Link>
    </Card>
  );
}
