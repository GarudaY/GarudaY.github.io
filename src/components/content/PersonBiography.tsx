"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { t } from "@/lib/localize";
import type { Person } from "@/types/content";
import { cn } from "@/lib/cn";

export function PersonBiography({
  person,
  locale,
  headingId,
  biography,
  className,
  buttonClassName,
  panelClassName,
}: {
  person: Person;
  locale: Locale;
  headingId: string;
  biography?: Person["bio"];
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const reactId = useId().replace(/:/g, "");
  const panelId = `person-bio-${reactId}`;
  const labelId = `person-bio-label-${reactId}`;

  return (
    <div
      className={cn("person-disclosure", className)}
      data-open={open ? "true" : "false"}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={`${headingId} ${labelId}`}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "person-disclosure-button focus-ring inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full text-sm font-semibold text-blue",
          buttonClassName,
        )}
      >
        <span id={labelId}>
          {open
            ? locale === "uk"
              ? "Згорнути"
              : "Weniger anzeigen"
            : locale === "uk"
              ? "Детальніше"
              : "Mehr erfahren"}
        </span>
        <span className="person-disclosure-icon grid h-7 w-7 place-items-center rounded-full border border-blue/20 bg-surface">
          <ChevronDown aria-hidden="true" className="h-4 w-4" />
        </span>
      </button>
      <div
        id={panelId}
        aria-hidden={!open}
        className={cn("person-disclosure-panel", panelClassName)}
      >
        <div>
          <p className="person-disclosure-copy text-sm leading-6 text-ink-muted">
            {t(biography ?? person.bio, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
