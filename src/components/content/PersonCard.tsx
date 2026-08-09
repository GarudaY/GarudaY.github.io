import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { t } from "@/lib/localize";
import type { Person } from "@/types/content";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PersonPortrait } from "@/components/content/PersonPortrait";

export function PersonCard({
  person,
  locale,
}: {
  person: Person;
  locale: Locale;
}) {
  return (
    <Card className="overflow-hidden">
      <Link
        href={getPath(locale, "people", person.slug)}
        className="focus-ring grid rounded-[18px] sm:grid-cols-[10rem_1fr]"
      >
        <PersonPortrait
          person={person}
          locale={locale}
          className="aspect-square rounded-none sm:h-full"
          sizes="10rem"
        />
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {person.isDemo ? <Badge tone="yellow">Demo</Badge> : null}
            <Badge tone="blue">
              {t(person.teacherRoleLabel ?? person.roleLabel, locale)}
            </Badge>
          </div>
          <h2 className="mt-4 text-xl font-bold text-blue-strong">
            {t(person.name, locale)}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-muted">
            {t(person.teacherBio ?? person.bio, locale)}
          </p>
          {person.languages.length ? (
            <p className="mt-4 text-sm font-semibold text-blue">
              {person.languages.map((lang) => lang.toUpperCase()).join(" / ")}
            </p>
          ) : null}
        </div>
      </Link>
    </Card>
  );
}
