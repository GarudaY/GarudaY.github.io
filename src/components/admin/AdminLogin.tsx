"use client";

import { KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { fieldClassName, FormField } from "@/components/ui/FormField";

export function AdminLogin({ locale }: { locale: Locale }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const isUk = locale === "uk";

  return (
    <div className="mx-auto max-w-xl rounded-[22px] border border-border bg-surface p-6 shadow-soft sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-strong text-yellow">
        <ShieldCheck aria-hidden="true" className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-bold text-blue-strong">
        {isUk ? "Вхід для команди" : "Team-Zugang"}
      </h2>
      <p className="mt-2 leading-7 text-ink-muted">
        {isUk
          ? "Заявки містять персональні дані, тому онлайн-панель закрита спільним кодом доступу."
          : "Anmeldungen enthalten personenbezogene Daten. Deshalb ist der Online-Bereich mit einem Team-Code geschützt."}
      </p>
      <form
        className="mt-7 grid gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(false);
          const data = new FormData(event.currentTarget);
          try {
            const response = await fetch("/api/admin/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password: data.get("password") }),
            });
            if (!response.ok) throw new Error("login_failed");
            window.location.reload();
          } catch {
            setError(true);
            setPending(false);
          }
        }}
      >
        {error ? (
          <Alert role="alert" tone="warning">
            {isUk
              ? "Код не підійшов або сервіс тимчасово недоступний."
              : "Der Code ist falsch oder der Dienst ist vorübergehend nicht verfügbar."}
          </Alert>
        ) : null}
        <FormField
          label={isUk ? "Код доступу" : "Zugangscode"}
          htmlFor="admin-password"
        >
          <div className="relative">
            <KeyRound
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            />
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={200}
              autoComplete="current-password"
              className={`${fieldClassName} pl-11`}
            />
          </div>
        </FormField>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : null}
          {pending
            ? isUk
              ? "Перевіряємо…"
              : "Wird geprüft…"
            : isUk
              ? "Відкрити панель"
              : "Bereich öffnen"}
        </Button>
      </form>
    </div>
  );
}
