import { Handshake, Lightbulb, UsersRound } from "lucide-react";
import type { Locale } from "@/i18n/config";

export function VereinUpdates({ locale }: { locale: Locale }) {
  const isUk = locale === "uk";
  const updates = [
    {
      icon: Handshake,
      status: isUk ? "Діалог із партнерами" : "Im Austausch",
      title: isUk
        ? "Більше простору для спільних ідей"
        : "Mehr Raum für gemeinsame Ideen",
      text: isUk
        ? "Обговорюємо з місцевими культурними просторами формат спільних майстерень та невеликих виставок. Шукаємо можливості, які допоможуть українській і німецькій спільнотам частіше зустрічатися."
        : "Mit lokalen Kulturorten sprechen wir über gemeinsame Werkstätten und kleine Ausstellungen. Wir suchen nach Möglichkeiten, ukrainische und deutsche Nachbarschaften öfter zusammenzubringen.",
    },
    {
      icon: Lightbulb,
      status: isUk ? "Готуємо проєкт" : "In Vorbereitung",
      title: isUk
        ? "Від ідеї — до сімейної майстерні"
        : "Aus einer Idee wird eine Familienwerkstatt",
      text: isUk
        ? "Команда збирає концепцію творчого проєкту для дітей і батьків: обираємо теми, рахуємо матеріали та продумуємо, як зробити участь доступною для різних родин."
        : "Das Team entwickelt ein Kreativprojekt für Kinder und Eltern: Wir sammeln Themen, planen Materialien und überlegen, wie unterschiedliche Familien unkompliziert mitmachen können.",
    },
    {
      icon: UsersRound,
      status: isUk ? "Усередині команди" : "Aus dem Team",
      title: isUk
        ? "Допомагати має бути простіше"
        : "Engagement soll leichter werden",
      text: isUk
        ? "Готуємо короткий путівник для нових волонтерів і зрозумілий розподіл завдань. Хочемо, щоб кожна людина знала, до кого звернутися та з чого почати."
        : "Wir bereiten einen kurzen Wegweiser für neue Ehrenamtliche und eine klare Aufgabenverteilung vor. Jede Person soll wissen, an wen sie sich wenden kann und wie der Einstieg gelingt.",
    },
  ];
  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {isUk ? "За лаштунками SONNENBLUME" : "Hinter den Kulissen"}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-blue-strong sm:text-4xl">
            {isUk ? "Над чим ми працюємо" : "Was wir gerade bewegen"}
          </h2>
        </div>
        <span className="rounded-full border border-blue/15 bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted">
          {isUk ? "Приклади новин" : "Beispielmeldungen"}
        </span>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {updates.map((update, index) => (
          <article
            key={update.title}
            className="verein-update-card rounded-[22px] border border-border bg-surface p-6 sm:p-7"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-[15px] bg-yellow/25 text-blue-strong">
                <update.icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <span
                aria-hidden="true"
                className="font-mono text-sm text-blue/45"
              >
                0{index + 1}
              </span>
            </div>
            <p className="mt-7 text-sm font-semibold text-blue">
              {update.status}
            </p>
            <h3 className="mt-2 text-2xl font-bold leading-tight text-blue-strong">
              {update.title}
            </h3>
            <p className="mt-4 text-base leading-7 text-ink-muted">
              {update.text}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
