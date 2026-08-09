import type { Locale } from "@/i18n/config";
import { t } from "@/lib/localize";
import type { Person } from "@/types/content";
import { PersonPortrait } from "@/components/content/PersonPortrait";
import { PersonBiography } from "@/components/content/PersonBiography";

function TeacherCard({ person, locale }: { person: Person; locale: Locale }) {
  const headingId = `teacher-${person.slug}-title`;

  return (
    <article
      aria-labelledby={headingId}
      className="teacher-profile-card group rounded-[20px] border border-border bg-surface p-4 sm:p-5"
    >
      <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-5">
        <PersonPortrait
          person={person}
          locale={locale}
          className="aspect-square rounded-[16px]"
          sizes="(min-width: 640px) 6rem, 5rem"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase leading-5 tracking-[0.12em] text-blue">
            {t(person.teacherRoleLabel ?? person.roleLabel, locale)}
          </p>
          <h3
            id={headingId}
            className="mt-1.5 break-words text-xl font-bold leading-tight text-blue-strong sm:text-2xl"
          >
            {t(person.name, locale)}
          </h3>
        </div>
      </div>
      <PersonBiography
        person={person}
        locale={locale}
        headingId={headingId}
        biography={person.teacherBio}
        className="mt-4 border-t border-border/75 pt-2"
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
      <ul className="mx-auto mt-7 grid max-w-6xl list-none items-start gap-4 p-0 md:grid-cols-2">
        {people.map((person) => (
          <li key={person.id} className="min-w-0">
            <TeacherCard person={person} locale={locale} />
          </li>
        ))}
      </ul>
    </section>
  );
}
