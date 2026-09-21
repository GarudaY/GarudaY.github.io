import { getPeopleForBuild } from "@/server/cms-people";
import { locales } from "@/i18n/config";

export async function getStaticPersonParams() {
  const people = await getPeopleForBuild();
  return locales.flatMap((locale) =>
    people.map((person) => ({ locale, slug: person.slug })),
  );
}
