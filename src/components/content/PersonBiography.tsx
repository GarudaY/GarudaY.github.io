import { ChevronDown } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { t } from "@/lib/localize";
import type { Person } from "@/types/content";
import { cn } from "@/lib/cn";

export function PersonBiography({
  person,
  locale,
  className,
}: {
  person: Person;
  locale: Locale;
  className?: string;
}) {
  return (
    <details
      className={cn(
        "person-details border-t border-border/75 text-left",
        className,
      )}
    >
      <summary className="focus-ring inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full text-sm font-semibold text-blue">
        {locale === "uk" ? "Читати повністю" : "Mehr lesen"}
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </summary>
      <div className="person-details-content">
        <div>
          <p className="pb-1 pt-2 text-sm leading-6 text-ink-muted">
            {t(person.bio, locale)}
          </p>
        </div>
      </div>
    </details>
  );
}
