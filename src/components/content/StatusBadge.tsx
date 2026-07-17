import type { CourseStatus, EventStatus } from "@/types/content";
import type { Locale } from "@/i18n/config";
import { Badge } from "@/components/ui/Badge";

const courseLabels: Record<CourseStatus, Record<Locale, string>> = {
  open: { uk: "Набір відкрито", de: "Anmeldung offen" },
  waitlist: { uk: "Лист очікування", de: "Warteliste" },
  closed: { uk: "Набір закрито", de: "Anmeldung geschlossen" },
  planned: { uk: "Планується", de: "Geplant" },
};

const eventLabels: Record<EventStatus, Record<Locale, string>> = {
  upcoming: { uk: "Найближча", de: "Bevorstehend" },
  past: { uk: "Архів", de: "Archiv" },
  cancelled: { uk: "Скасовано", de: "Abgesagt" },
};

export function CourseStatusBadge({
  status,
  locale,
}: {
  status: CourseStatus;
  locale: Locale;
}) {
  const tone =
    status === "open"
      ? "green"
      : status === "waitlist"
        ? "yellow"
        : status === "closed"
          ? "danger"
          : "blue";
  return <Badge tone={tone}>{courseLabels[status][locale]}</Badge>;
}

export function EventStatusBadge({
  status,
  locale,
}: {
  status: EventStatus;
  locale: Locale;
}) {
  const tone =
    status === "upcoming"
      ? "green"
      : status === "cancelled"
        ? "danger"
        : "neutral";
  return <Badge tone={tone}>{eventLabels[status][locale]}</Badge>;
}
