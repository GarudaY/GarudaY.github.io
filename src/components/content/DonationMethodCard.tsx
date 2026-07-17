import { BadgeEuro, Landmark, Package, QrCode, ShieldCheck } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { t, tList } from "@/lib/localize";
import type { DonationMethod } from "@/types/content";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const icons = {
  bank: Landmark,
  paypal: BadgeEuro,
  qr: QrCode,
  "in-kind": Package,
};

export function DonationMethodCard({
  method,
  locale,
}: {
  method: DonationMethod;
  locale: Locale;
}) {
  const Icon = icons[method.type];

  return (
    <Card className="grid gap-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-blue/10 text-blue">
          <Icon aria-hidden="true" className="h-6 w-6" />
        </div>
        {method.isDemo ? <Badge tone="yellow">Demo</Badge> : null}
      </div>
      <div>
        <h2 className="text-xl font-bold text-blue-strong">
          {t(method.title, locale)}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {t(method.description, locale)}
        </p>
      </div>
      {method.type === "qr" ? (
        <div className="flex min-h-44 flex-col items-center justify-center rounded-[8px] border border-dashed border-blue/35 bg-blue/[0.04] p-6 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-blue/10 text-blue">
            <ShieldCheck aria-hidden="true" className="h-7 w-7" />
          </span>
          <p className="mt-4 max-w-64 text-sm font-semibold leading-6 text-blue-strong">
            {locale === "uk"
              ? "Платіжний QR буде створено з перевірених реквізитів"
              : "Der Zahlungs-QR wird aus verifizierten Daten erzeugt"}
          </p>
        </div>
      ) : null}
      <ul className="grid gap-2 rounded-[8px] bg-surface-muted p-4 text-sm text-blue-strong">
        {tList(method.details, locale).map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </Card>
  );
}
