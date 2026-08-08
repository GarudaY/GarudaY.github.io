import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { siteConfig } from "@/config/site";

export function SiteLogo({ locale }: { locale: Locale }) {
  return (
    <Link
      href={getPath(locale, "home")}
      className="focus-ring inline-flex min-h-12 items-center gap-3 rounded-full"
    >
      <span className="site-mark grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-white shadow-soft">
        <Image
          src="/images/brand/sonnenblume-mark.jpg"
          alt=""
          width={190}
          height={190}
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold text-blue-strong sm:text-base">
          {siteConfig.shortName[locale]}
        </span>
        <span className="hidden text-xs text-ink-muted sm:block">
          Interkultureller Verein e.V.
        </span>
      </span>
    </Link>
  );
}
