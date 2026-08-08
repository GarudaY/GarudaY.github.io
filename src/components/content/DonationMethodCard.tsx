import Image from "next/image";
import { BadgeEuro, Landmark, Package, QrCode } from "lucide-react";
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
        <div className="flex min-h-44 items-center justify-center rounded-[12px] border border-blue/15 bg-white p-5">
          <Image
            src="/images/donation/bank-transfer-qr.png"
            alt={
              locale === "uk"
                ? "QR-код для банківського переказу на рахунок SONNENBLUME"
                : "QR-Code für eine Banküberweisung an SONNENBLUME"
            }
            width={270}
            height={270}
            className="h-auto w-full max-w-56"
          />
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
