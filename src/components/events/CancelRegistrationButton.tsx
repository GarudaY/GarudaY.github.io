"use client";

import { LoaderCircle, XCircle } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { apiUrl } from "@/lib/api-url";
import type { RegistrationStatus } from "@/types/operations";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export function CancelRegistrationButton({
  token,
  locale,
  initialStatus,
}: {
  token: string;
  locale: Locale;
  initialStatus: RegistrationStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const isUk = locale === "uk";

  if (status === "cancelled") {
    return (
      <Alert role="status" tone="warning" className="mt-6">
        <span className="flex items-start gap-3">
          <XCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          {isUk
            ? "Заявку скасовано. Якщо звільнилося місце, система вже перевірила чергу очікування."
            : "Die Anmeldung wurde storniert. Falls ein Platz frei wurde, hat das System die Warteliste bereits geprüft."}
        </span>
      </Alert>
    );
  }

  return (
    <div className="mt-6">
      {error ? (
        <Alert role="alert" tone="warning" className="mb-4">
          {isUk
            ? "Не вдалося скасувати заявку. Спробуйте ще раз."
            : "Die Anmeldung konnte nicht storniert werden. Bitte versuchen Sie es erneut."}
        </Alert>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        disabled={pending}
        className="border-danger/30 text-danger hover:border-danger/60 disabled:cursor-wait disabled:opacity-60"
        onClick={async () => {
          setPending(true);
          setError(false);
          try {
            const response = await fetch(
              apiUrl(`/api/registrations/${token}`),
              {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: "{}",
              },
            );
            if (!response.ok) throw new Error("cancel_failed");
            setStatus("cancelled");
            window.dispatchEvent(new Event("registration:changed"));
          } catch {
            setError(true);
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <XCircle aria-hidden="true" className="h-4 w-4" />
        )}
        {pending
          ? isUk
            ? "Скасовуємо…"
            : "Wird storniert…"
          : isUk
            ? "Скасувати заявку"
            : "Anmeldung stornieren"}
      </Button>
    </div>
  );
}
