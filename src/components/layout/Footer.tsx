import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPath } from "@/i18n/routing";
import { t } from "@/lib/localize";
import type { SiteSettings, SocialLink } from "@/types/content";
import { Container } from "@/components/ui/Container";
import { SiteLogo } from "@/components/layout/SiteLogo";

function SocialIcon({ type }: { type: SocialLink["type"] }) {
  if (type === "instagram") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (type === "facebook") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M13.7 21v-8h2.8l.42-3.12H13.7V7.9c0-.9.26-1.52 1.62-1.52H17V3.6c-.3-.04-1.32-.12-2.5-.12-2.48 0-4.18 1.5-4.18 4.28v2.12H7.5V13h2.82v8h3.38Z" />
      </svg>
    );
  }

  if (type === "telegram") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="m21 3-7.4 18-4.2-7.2L3 10.5 21 3Z" />
        <path d="m9.4 13.8 4.2 3.1L21 3" />
      </svg>
    );
  }

  return <ArrowUpRight aria-hidden="true" className="h-4 w-4" />;
}

export function Footer({
  locale,
  settings,
}: {
  locale: Locale;
  settings: SiteSettings;
}) {
  const dict = getDictionary(locale);

  return (
    <footer className="site-footer border-t border-border/80 text-blue-strong">
      <Container className="py-10 sm:py-12 lg:py-14">
        <div className="footer-brand-panel grid gap-6 rounded-[26px] border border-border bg-surface/88 p-6 shadow-soft backdrop-blur sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <SiteLogo locale={locale} />
            <p className="mt-5 max-w-xl text-sm leading-7 text-ink-muted">
              {t(settings.description, locale)}
            </p>
          </div>
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-yellow/24 px-4 py-2 text-sm font-semibold text-blue-strong">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-yellow shadow-[0_0_0_5px_rgba(244,200,74,0.14)]"
            />
            {dict.footer.demo}
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.35fr_0.75fr_0.9fr]">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {dict.nav.contact}
            </h2>
            <ul className="mt-5 grid gap-3 text-sm text-ink-muted sm:grid-cols-2 lg:grid-cols-1">
              <li className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-blue-strong text-yellow">
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="pt-2.5 leading-5">
                  {t(settings.contact.address, locale)}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-surface text-blue shadow-sm">
                  <Mail aria-hidden="true" className="h-4 w-4" />
                </span>
                <a
                  className="footer-link focus-ring inline-flex min-h-11 items-center rounded-full"
                  href={`mailto:${settings.contact.email}`}
                >
                  {settings.contact.email}
                </a>
              </li>
              <li className="flex items-center gap-3 sm:col-span-2 lg:col-span-1">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-surface text-blue shadow-sm">
                  <Phone aria-hidden="true" className="h-4 w-4" />
                </span>
                <a
                  className="footer-link focus-ring inline-flex min-h-11 items-center rounded-full"
                  href={`tel:${settings.contact.phone.replaceAll(" ", "")}`}
                >
                  {settings.contact.phone}
                </a>
              </li>
            </ul>
          </section>

          <nav aria-label={dict.footer.legal}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {dict.footer.legal}
            </h2>
            <ul className="mt-4 grid gap-1 text-sm text-ink-muted">
              {settings.legalLinks.map((link) => (
                <li key={link.route}>
                  <Link
                    className="footer-link focus-ring inline-flex min-h-11 items-center gap-2 rounded-full"
                    href={getPath(locale, link.route)}
                  >
                    {t(link.label, locale)}
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dict.footer.social}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {dict.footer.social}
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2 text-sm">
              {settings.socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    className="footer-social focus-ring inline-flex min-h-11 items-center gap-2.5 rounded-full border border-border bg-surface px-4 font-semibold text-blue-strong"
                    href={link.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-muted text-blue">
                      <SocialIcon type={link.type} />
                    </span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{t(settings.name, locale)} · Demo</p>
          <p>
            {locale === "uk"
              ? "Спільнота, освіта та взаємопідтримка"
              : "Gemeinschaft, Bildung und gegenseitige Unterstützung"}
          </p>
        </div>
      </Container>
    </footer>
  );
}
