import type { Locale } from "@/i18n/config";
import { t } from "@/lib/localize";
import type { Statistic } from "@/types/content";

export function StatsSection({
  stats,
  locale,
}: {
  stats: Statistic[];
  locale: Locale;
}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          className="metric-card rounded-[16px] border border-border bg-surface/95 p-5"
          key={stat.id}
        >
          <dt className="text-sm leading-6 text-ink-muted">
            {t(stat.label, locale)}
          </dt>
          <dd className="mt-2 text-4xl font-bold text-blue-strong">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
