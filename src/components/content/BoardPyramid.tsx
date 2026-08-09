import { UsersRound } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { t } from "@/lib/localize";
import type { Person } from "@/types/content";
import { Badge } from "@/components/ui/Badge";
import { PersonPortrait } from "@/components/content/PersonPortrait";
import { PersonBiography } from "@/components/content/PersonBiography";

function ChairCard({ person, locale }: { person: Person; locale: Locale }) {
  const headingId = `board-${person.slug}-title`;

  return (
    <article
      aria-labelledby={headingId}
      className="board-chair-card card-surface mx-auto grid w-full max-w-2xl overflow-hidden rounded-[24px] border border-blue/20 bg-surface shadow-soft sm:grid-cols-[10.5rem_minmax(0,1fr)]"
    >
      <PersonPortrait
        person={person}
        locale={locale}
        preload
        className="aspect-[16/9] rounded-none sm:aspect-auto sm:h-full sm:min-h-52"
        sizes="(min-width: 640px) 10.5rem, 100vw"
      />
      <div className="p-5 text-left sm:p-6">
        <Badge tone="yellow">{t(person.roleLabel, locale)}</Badge>
        <h3
          id={headingId}
          className="mt-3 text-2xl font-bold text-blue-strong sm:text-[1.7rem]"
        >
          {t(person.name, locale)}
        </h3>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {locale === "uk"
            ? "Координує роботу правління та представляє об’єднання."
            : "Koordiniert die Vorstandsarbeit und vertritt den Verein."}
        </p>
        <PersonBiography
          person={person}
          locale={locale}
          headingId={headingId}
          className="mt-3 border-t border-border/75 pt-2"
        />
      </div>
    </article>
  );
}

function MemberCard({ person, locale }: { person: Person; locale: Locale }) {
  const headingId = `board-${person.slug}-title`;

  return (
    <article
      aria-labelledby={headingId}
      className="board-member-card group rounded-[18px] border border-border/90 bg-surface/90 p-4 sm:p-5"
    >
      <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
        <PersonPortrait
          person={person}
          locale={locale}
          className="aspect-square rounded-[14px]"
          sizes="(min-width: 640px) 6.5rem, 5.75rem"
        />
        <div className="min-w-0">
          <Badge tone="blue" className="max-w-full whitespace-normal leading-5">
            {t(person.roleLabel, locale)}
          </Badge>
          <h3
            id={headingId}
            className="mt-3 break-words text-xl font-bold leading-tight text-blue-strong"
          >
            {t(person.name, locale)}
          </h3>
        </div>
      </div>
      <PersonBiography
        person={person}
        locale={locale}
        headingId={headingId}
        className="mt-4 border-t border-border/75 pt-2"
      />
    </article>
  );
}

export function BoardPyramid({
  chair,
  members,
  locale,
}: {
  chair?: Person;
  members: Person[];
  locale: Locale;
}) {
  const isUk = locale === "uk";

  return (
    <section aria-labelledby="board-title" className="min-w-0">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
          {isUk ? "Правління" : "Vorstand"}
        </p>
        <h2
          id="board-title"
          className="mt-3 text-balance text-3xl font-bold text-blue-strong sm:text-4xl"
        >
          {isUk ? "П’ять людей — одна команда" : "Fünf Menschen — ein Team"}
        </h2>
        <p className="mt-4 text-balance leading-7 text-ink-muted">
          {isUk
            ? "Голова координує роботу, а кожна учасниця правління відповідає за свій напрям."
            : "Die Vorsitzende koordiniert die Arbeit; jedes Vorstandsmitglied verantwortet einen eigenen Bereich."}
        </p>
      </div>

      <div className="board-pyramid mx-auto mt-8 max-w-6xl sm:mt-10">
        {chair ? <ChairCard person={chair} locale={locale} /> : null}

        {chair && members.length > 0 ? (
          <div className="board-pyramid-link" aria-hidden="true">
            <span />
          </div>
        ) : null}

        {members.length > 0 ? (
          <div className="board-pyramid-team rounded-[26px] border border-blue/15 p-3 sm:p-5 lg:p-6">
            <div className="relative z-10 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue/15 bg-surface px-4 py-2 text-sm font-semibold text-blue-strong shadow-[0_8px_24px_rgba(23,57,87,0.08)]">
                <UsersRound aria-hidden="true" className="h-4 w-4 text-blue" />
                {isUk ? "Члени правління" : "Weitere Vorstandsmitglieder"}
              </span>
            </div>

            <ol className="relative z-10 mt-5 grid list-none items-start gap-3 p-0 md:grid-cols-2 lg:gap-4">
              {members.map((person) => (
                <li key={person.id} className="min-w-0">
                  <MemberCard person={person} locale={locale} />
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
