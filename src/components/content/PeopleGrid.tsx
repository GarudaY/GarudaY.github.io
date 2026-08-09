import type { Locale } from "@/i18n/config";
import { t } from "@/lib/localize";
import type { Person } from "@/types/content";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PersonPortrait } from "@/components/content/PersonPortrait";
import { PersonBiography } from "@/components/content/PersonBiography";

function PersonProfileCard({
  person,
  locale,
}: {
  person: Person;
  locale: Locale;
}) {
  return (
    <Card className="teacher-profile-card group p-4 sm:p-5">
      <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-5">
        <PersonPortrait
          person={person}
          locale={locale}
          className="aspect-square rounded-[15px]"
          sizes="(min-width: 640px) 7rem, 5.75rem"
        />
        <div className="min-w-0">
          <Badge tone="blue" className="max-w-full whitespace-normal leading-5">
            {t(person.roleLabel, locale)}
          </Badge>
          <h3 className="mt-3 break-words text-xl font-bold leading-tight text-blue-strong">
            {t(person.name, locale)}
          </h3>
        </div>
      </div>
      <PersonBiography person={person} locale={locale} className="mt-4 pt-2" />
    </Card>
  );
}

export function PeopleGrid({
  locale,
  people,
  title,
  description,
}: {
  locale: Locale;
  people: Person[];
  title: string;
  description: string;
}) {
  return (
    <section className="min-w-0">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="break-words text-3xl font-bold text-blue-strong">
          {title}
        </h2>
        <p className="mt-3 leading-7 text-ink-muted">{description}</p>
      </div>
      <div className="mx-auto mt-7 grid max-w-5xl items-start gap-4 md:grid-cols-2">
        {people.map((person) => (
          <PersonProfileCard key={person.id} person={person} locale={locale} />
        ))}
      </div>
    </section>
  );
}
