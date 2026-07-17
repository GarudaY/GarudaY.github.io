import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { t } from "@/lib/localize";
import type { ContactSettings } from "@/types/content";
import { Card } from "@/components/ui/Card";

export function ContactCard({
  contact,
  locale,
}: {
  contact: ContactSettings;
  locale: Locale;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-xl font-bold text-blue-strong">
        {locale === "uk" ? "Контактні дані" : "Kontaktdaten"}
      </h2>
      <dl className="mt-5 grid gap-4 text-sm text-ink-muted">
        <div className="flex gap-3">
          <Mail
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-blue"
          />
          <div>
            <dt className="font-semibold text-blue-strong">Email</dt>
            <dd>
              <a
                href={`mailto:${contact.email}`}
                className="focus-ring -my-2 inline-flex min-h-11 items-center rounded-full hover:text-blue"
              >
                {contact.email}
              </a>
            </dd>
          </div>
        </div>
        <div className="flex gap-3">
          <Phone
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-blue"
          />
          <div>
            <dt className="font-semibold text-blue-strong">
              {locale === "uk" ? "Телефон" : "Telefon"}
            </dt>
            <dd>
              <a
                href={`tel:${contact.phone.replaceAll(" ", "")}`}
                className="focus-ring -my-2 inline-flex min-h-11 items-center rounded-full hover:text-blue"
              >
                {contact.phone}
              </a>
            </dd>
          </div>
        </div>
        <div className="flex gap-3">
          <MapPin
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-blue"
          />
          <div>
            <dt className="font-semibold text-blue-strong">
              {locale === "uk" ? "Адреса" : "Adresse"}
            </dt>
            <dd>{t(contact.address, locale)}</dd>
          </div>
        </div>
        <div className="flex gap-3">
          <Clock
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-blue"
          />
          <div>
            <dt className="font-semibold text-blue-strong">
              {locale === "uk" ? "Години" : "Sprechzeiten"}
            </dt>
            <dd>{t(contact.officeHours, locale)}</dd>
          </div>
        </div>
      </dl>
    </Card>
  );
}
