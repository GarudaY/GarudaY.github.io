import { ChevronDown } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { t } from "@/lib/localize";
import type { Person } from "@/types/content";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PersonPortrait } from "@/components/content/PersonPortrait";

export function PersonProfileCard({
  person,
  locale,
  featured = false,
  preload = false,
}: {
  person: Person;
  locale: Locale;
  featured?: boolean;
  preload?: boolean;
}) {
  return (
    <Card
      className={`group h-full overflow-hidden ${
        featured ? "mx-auto w-full max-w-xl border-blue/20 shadow-soft" : ""
      }`}
    >
      <PersonPortrait
        person={person}
        locale={locale}
        preload={preload}
        className="aspect-[4/3] rounded-none"
        sizes={
          featured
            ? "(min-width: 640px) 36rem, 100vw"
            : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
        }
      />
      <div className={`p-5 sm:p-6 ${featured ? "text-center sm:p-8" : ""}`}>
        <div
          className={featured ? "flex justify-center" : "flex flex-wrap gap-2"}
        >
          <Badge tone={featured ? "yellow" : "blue"}>
            {t(person.roleLabel, locale)}
          </Badge>
        </div>
        <h3
          className={`mt-4 font-bold text-blue-strong ${
            featured ? "text-3xl" : "text-2xl"
          }`}
        >
          {t(person.name, locale)}
        </h3>
        <details className="person-details mt-4 border-t border-border/80 pt-3 text-left">
          <summary
            className={`focus-ring inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full text-sm font-semibold text-blue ${
              featured ? "w-full justify-center" : ""
            }`}
          >
            {locale === "uk" ? "Читати повністю" : "Mehr lesen"}
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 transition-transform"
            />
          </summary>
          <p className="pb-1 pt-2 text-sm leading-7 text-ink-muted">
            {t(person.bio, locale)}
          </p>
        </details>
      </div>
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
      <div className="mx-auto mt-7 grid max-w-5xl gap-5 md:grid-cols-2">
        {people.map((person) => (
          <PersonProfileCard key={person.id} person={person} locale={locale} />
        ))}
      </div>
    </section>
  );
}
