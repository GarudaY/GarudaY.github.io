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
  compact = false,
  preload = false,
}: {
  person: Person;
  locale: Locale;
  featured?: boolean;
  compact?: boolean;
  preload?: boolean;
}) {
  return (
    <Card
      className={`group h-full overflow-hidden ${
        featured && compact
          ? "mx-auto w-full max-w-2xl border-blue/20 shadow-soft sm:grid sm:grid-cols-[13rem_minmax(0,1fr)]"
          : featured
            ? "mx-auto w-full max-w-xl border-blue/20 shadow-soft"
            : compact
              ? "sm:grid sm:grid-cols-[9rem_minmax(0,1fr)]"
              : ""
      }`}
    >
      <PersonPortrait
        person={person}
        locale={locale}
        preload={preload}
        className={
          featured && compact
            ? "aspect-[16/10] rounded-none sm:aspect-auto sm:h-full sm:min-h-56"
            : compact
              ? "aspect-[16/9] rounded-none sm:aspect-auto sm:h-full sm:min-h-48"
              : "aspect-[4/3] rounded-none"
        }
        sizes={
          featured && compact
            ? "(min-width: 640px) 13rem, 100vw"
            : compact
              ? "(min-width: 640px) 9rem, 100vw"
              : featured
                ? "(min-width: 640px) 36rem, 100vw"
                : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
        }
      />
      <div
        className={`${compact ? "p-4 sm:p-5" : "p-5 sm:p-6"} ${
          featured && !compact ? "text-center sm:p-8" : ""
        }`}
      >
        <div
          className={
            featured && !compact
              ? "flex justify-center"
              : "flex flex-wrap gap-2"
          }
        >
          <Badge tone={featured ? "yellow" : "blue"}>
            {t(person.roleLabel, locale)}
          </Badge>
        </div>
        <h3
          className={`${compact ? "mt-3" : "mt-4"} font-bold text-blue-strong ${
            featured
              ? compact
                ? "text-2xl"
                : "text-3xl"
              : compact
                ? "text-xl"
                : "text-2xl"
          }`}
        >
          {t(person.name, locale)}
        </h3>
        <details
          className={`person-details border-t border-border/80 text-left ${
            compact ? "mt-3 pt-2" : "mt-4 pt-3"
          }`}
        >
          <summary
            className={`focus-ring inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full text-sm font-semibold text-blue ${
              featured && !compact ? "w-full justify-center" : ""
            }`}
          >
            {locale === "uk" ? "Читати повністю" : "Mehr lesen"}
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 transition-transform"
            />
          </summary>
          <p
            className={`pb-1 pt-2 text-sm text-ink-muted ${
              compact ? "leading-6" : "leading-7"
            }`}
          >
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
  compact = false,
}: {
  locale: Locale;
  people: Person[];
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <section className="min-w-0">
      <div
        className={`mx-auto text-center ${compact ? "max-w-2xl" : "max-w-3xl"}`}
      >
        <h2
          className={`break-words font-bold text-blue-strong ${
            compact ? "text-2xl" : "text-3xl"
          }`}
        >
          {title}
        </h2>
        <p
          className={`${compact ? "mt-2 text-sm leading-6" : "mt-3 leading-7"} text-ink-muted`}
        >
          {description}
        </p>
      </div>
      <div
        className={`mx-auto grid ${
          compact
            ? "mt-5 max-w-5xl gap-4 sm:grid-cols-2"
            : "mt-7 max-w-5xl gap-5 md:grid-cols-2"
        }`}
      >
        {people.map((person) => (
          <PersonProfileCard
            key={person.id}
            person={person}
            locale={locale}
            compact={compact}
          />
        ))}
      </div>
    </section>
  );
}
