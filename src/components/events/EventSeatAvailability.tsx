"use client";

import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { RegistrationAvailability } from "@/types/operations";

export function EventSeatAvailability({
  eventSlug,
  locale,
  initialAvailable,
  capacity,
  registrationLabel,
}: {
  eventSlug: string;
  locale: Locale;
  initialAvailable: number;
  capacity: number;
  registrationLabel: string;
}) {
  const [availability, setAvailability] = useState<RegistrationAvailability>({
    eventSlug,
    capacity,
    remainingSeats: initialAvailable,
    confirmedParticipants: 0,
    waitlistPeople: 0,
  });

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/registrations?event=${encodeURIComponent(eventSlug)}`,
        { cache: "no-store" },
      );
      if (response.ok) {
        setAvailability((await response.json()) as RegistrationAvailability);
      }
    } catch {
      // The server-rendered value remains a safe fallback when live refresh fails.
    }
  }, [eventSlug]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    window.addEventListener("registration:changed", refresh);
    return () => {
      window.clearTimeout(initialRefresh);
      window.removeEventListener("registration:changed", refresh);
    };
  }, [refresh]);

  return (
    <span aria-live="polite">
      {availability.remainingSeats} / {availability.capacity}
      {availability.waitlistPeople > 0 ? (
        <span className="mt-1 block text-xs">
          {locale === "uk"
            ? `у черзі: ${availability.waitlistPeople}`
            : `Warteliste: ${availability.waitlistPeople}`}
        </span>
      ) : null}
      <span className="mt-1 block text-xs font-medium">
        {availability.remainingSeats === 0
          ? locale === "uk"
            ? "Місць немає — нові заявки потраплять у чергу"
            : "Ausgebucht — neue Anmeldungen kommen auf die Warteliste"
          : registrationLabel}
      </span>
    </span>
  );
}
