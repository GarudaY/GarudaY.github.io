import { getEventsForBuild } from "@/server/cms-events";
import { locales } from "@/i18n/config";

export async function getStaticEventParams() {
  const events = await getEventsForBuild();
  return locales.flatMap((locale) =>
    events.map((event) => ({ locale, slug: event.slug })),
  );
}
