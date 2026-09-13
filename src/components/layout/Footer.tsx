import Link from "next/link";
import { ArrowUpRight, FileCheck2, Mail, MapPin, Phone } from "lucide-react";
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
  const isUk = locale === "uk";
  const emails = [
    {
      label: isUk ? "Загальні питання" : "Allgemeine Anfragen",
      value: settings.contact.email,
    },
    {
      label: isUk ? "Курси" : "Kurse",
      value: settings.contact.coursesEmail,
    },
    {
      label: isUk ? "Правління" : "Vorstand",
      value: settings.contact.boardEmail,
    },
  ];

  return (
    <footer className="site-footer border-t border-border/80 text-blue-strong">
      <Container className="py-10 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr_0.62fr_0.72fr] lg:gap-8">
          <section aria-labelledby="footer-identity">
            <h2 id="footer-identity" className="sr-only">
              {t(settings.name, locale)}
            </h2>
            <SiteLogo locale={locale} />
            <p className="mt-5 max-w-md text-sm leading-7 text-ink-muted">
              {t(settings.description, locale)}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {dict.nav.contact}
            </h2>
            <div className="mt-5 flex items-start gap-3 text-sm text-ink-muted">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-blue"
              />
              <span className="leading-6">
                {t(settings.contact.address, locale)}
              </span>
            </div>
            <ul className="mt-4 grid gap-2 text-sm">
              {emails.map((email) => (
                <li key={email.value}>
                  <a
                    className="footer-link focus-ring group inline-flex min-h-11 items-center gap-3 rounded-full text-ink-muted"
                    href={`mailto:${email.value}`}
                  >
                    <Mail
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-blue"
                    />
                    <span>
                      <span className="block text-xs text-ink-muted">
                        {email.label}
                      </span>
                      <span className="font-semibold text-blue-strong">
                        {email.value}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
              {settings.contact.phone ? (
                <li>
                  <a
                    className="footer-link focus-ring inline-flex min-h-11 items-center gap-3 rounded-full text-ink-muted"
                    href={`tel:${settings.contact.phone.replaceAll(" ", "")}`}
                  >
                    <Phone
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-blue"
                    />
                    {settings.contact.phone}
                  </a>
                </li>
              ) : null}
            </ul>
          </section>

          <nav aria-label={dict.footer.legal}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              {dict.footer.legal}
            </h2>
            <ul className="mt-4 grid gap-1 text-sm text-ink-muted">
              <li>
                <a
                  className="footer-link focus-ring inline-flex min-h-11 items-center gap-2 rounded-full"
                  href="/documents/membership/satzung-sonnenblume.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileCheck2
                    aria-hidden="true"
                    className="h-4 w-4 text-blue"
                  />
                  Satzung
                </a>
              </li>
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
            <ul className="mt-5 grid gap-2 text-sm">
              {settings.socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    className="footer-social focus-ring inline-flex min-h-11 w-full items-center gap-3 rounded-full border border-border bg-surface px-3 font-semibold text-blue-strong"
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
              <li>
                <span
                  aria-disabled="true"
                  className="inline-flex min-h-11 w-full items-center gap-3 rounded-full border border-dashed border-blue/25 bg-surface/50 px-3 text-blue-strong"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-muted text-blue">
                    <SocialIcon type="telegram" />
                  </span>
                  <span className="font-semibold">Telegram</span>
                  <span className="ml-auto text-xs text-ink-muted">
                    {isUk ? "Незабаром" : "Demnächst"}
                  </span>
                </span>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-9 border-t border-border pt-5">
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} {t(settings.name, locale)}
          </p>
        </div>
      </Container>
    </footer>
  );
}
