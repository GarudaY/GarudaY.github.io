import type { Locale } from "@/i18n/config";
import { t } from "@/lib/localize";
import type { Person } from "@/types/content";
import { PersonPortrait } from "@/components/content/PersonPortrait";
import { PersonBiography } from "@/components/content/PersonBiography";

function TeacherDirectoryItem({
  person,
  locale,
}: {
  person: Person;
  locale: Locale;
}) {
  const headingId = `teacher-${person.slug}-title`;

  return (
    <article
      aria-labelledby={headingId}
      className="teacher-directory-item group grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-x-4 px-4 py-5 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:gap-x-6 sm:px-6 sm:py-6"
    >
      <PersonPortrait
        person={person}
        locale={locale}
        className="aspect-square rounded-full"
        sizes="(min-width: 640px) 6rem, 4.75rem"
      />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase leading-5 tracking-[0.12em] text-blue">
          {t(person.roleLabel, locale)}
        </p>
        <h3
          id={headingId}
          className="mt-1.5 break-words text-xl font-bold leading-tight text-blue-strong sm:text-2xl"
        >
          {t(person.name, locale)}
        </h3>
      </div>
      <PersonBiography
        person={person}
        locale={locale}
        headingId={headingId}
        className="contents"
        buttonClassName="col-start-2 mt-3 w-fit justify-self-start sm:col-start-3 sm:row-start-1 sm:mt-0 sm:justify-self-end"
        panelClassName="col-span-full sm:col-start-2 sm:col-end-4"
      />
    </article>
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
      <ul className="teacher-directory mx-auto mt-7 max-w-4xl list-none overflow-hidden rounded-[24px] border border-border bg-surface p-0 shadow-soft">
        {people.map((person) => (
          <li
            key={person.id}
            className="border-b border-border/80 last:border-0"
          >
            <TeacherDirectoryItem person={person} locale={locale} />
          </li>
        ))}
      </ul>
    </section>
  );
}
