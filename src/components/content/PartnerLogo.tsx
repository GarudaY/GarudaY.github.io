import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { t } from "@/lib/localize";
import type { Partner } from "@/types/content";

export function PartnerLogo({
  partner,
  locale,
}: {
  partner: Partner;
  locale: Locale;
}) {
  const inner = (
    <div className="partner-card group grid h-full gap-4 rounded-[18px] border border-border bg-surface p-5 shadow-sm">
      <div className="grid min-h-24 place-items-center rounded-[14px] bg-surface-muted/65 p-3 transition-colors duration-300 group-hover:bg-surface-muted">
        <Image
          src={partner.logo.src}
          alt={t(partner.logo.alt, locale)}
          width={240}
          height={88}
          className="h-20 w-full object-contain"
        />
      </div>
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-blue-strong">{partner.name}</h3>
          <ArrowUpRight
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-blue transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {t(partner.description, locale)}
        </p>
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
