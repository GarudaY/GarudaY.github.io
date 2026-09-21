import Image from "next/image";
import { Handshake, Lightbulb, UsersRound } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { getVereinUpdates } from "@/server/verein-updates";
import { Section } from "@/components/ui/Section";

const icons = { handshake: Handshake, lightbulb: Lightbulb, users: UsersRound };

export async function VereinUpdates({ locale }: { locale: Locale }) {
  const isUk = locale === "uk";
  const updates = await getVereinUpdates();
  if (!updates.length) return null;
  const allExamples = updates.every((item) => item.isExample);
  return (
    <Section id="team-news" className="section-soft">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {isUk ? "За лаштунками SONNENBLUME" : "Hinter den Kulissen"}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-blue-strong sm:text-4xl">
            {isUk ? "Над чим ми працюємо" : "Was wir gerade bewegen"}
          </h2>
        </div>
        {allExamples && (
          <span className="rounded-full border border-blue/15 bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted">
            {isUk ? "Приклади новин" : "Beispielmeldungen"}
          </span>
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {updates.map((update, index) => {
          const Icon = icons[update.icon];
          return (
            <article
              key={update.id}
              className="verein-update-card overflow-hidden rounded-[22px] border border-border bg-surface"
            >
              {update.image && (
                <div className="relative aspect-[16/10]">
                  <Image
                    src={update.image.url}
                    alt={update.image.alt[locale]}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                    style={{ objectPosition: `50% ${update.image.focus}%` }}
                  />
                </div>
              )}
              <div className="p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  {!update.image && (
                    <span className="grid h-12 w-12 place-items-center rounded-[15px] bg-yellow/25 text-blue-strong">
                      <Icon aria-hidden="true" className="h-6 w-6" />
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className="ml-auto font-mono text-sm text-blue/45"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-7 text-sm font-semibold text-blue">
                  {update.status[locale]}
                </p>
                <h3 className="mt-2 break-words text-2xl font-bold leading-tight text-blue-strong">
                  {update.title[locale]}
                </h3>
                <p className="mt-4 whitespace-pre-line break-words text-base leading-7 text-ink-muted">
                  {update.text[locale]}
                </p>
                {update.isExample && !allExamples && (
                  <p className="mt-4 text-xs text-ink-muted">
                    {isUk ? "Демонстраційний приклад" : "Beispielmeldung"}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
