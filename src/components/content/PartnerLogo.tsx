import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { t } from "@/lib/localize";
import { cn } from "@/lib/cn";
import type { Partner } from "@/types/content";

export function PartnerLogo({
  partner,
  locale,
  compact = false,
}: {
  partner: Partner;
  locale: Locale;
  compact?: boolean;
}) {
  const inner = (
    <div
      className={cn(
        "partner-card group grid h-full rounded-[18px] border border-border bg-surface shadow-sm",
        compact ? "gap-3 p-3" : "gap-4 p-5",
      )}
    >
      <div
        className={cn(
          "grid place-items-center rounded-[14px] bg-surface-muted/65 p-3 transition-colors duration-300 group-hover:bg-surface-muted",
          compact ? "min-h-18" : "min-h-24",
        )}
      >
        <Image
          src={partner.logo.src}
          alt={t(partner.logo.alt, locale)}
          width={240}
          height={88}
          className={cn("w-full object-contain", compact ? "h-12" : "h-20")}
        />
      </div>
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn("font-bold text-blue-strong", compact && "text-sm")}
          >
            {partner.name}
          </h3>
          {compact ? null : (
            <ArrowUpRight
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-blue transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          )}
        </div>
        {compact ? null : (
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {t(partner.description, locale)}
          </p>
        )}
      </div>
    </div>
  );

  if (!partner.website) {
    return inner;
  }

  return (
    <a
      href={partner.website}
      className="focus-ring block h-full rounded-[18px]"
      rel="noreferrer"
      target="_blank"
    >
      {inner}
    </a>
  );
}
