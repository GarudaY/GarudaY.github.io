import type { Locale } from "@/i18n/config";

export const dictionaries = {
  uk: {
    nav: {
      about: "Про нас",
      courses: "Курси",
      events: "Події",
      news: "Новини",
      donate: "Підтримати",
      contact: "Контакти",
      menu: "Меню",
      close: "Закрити меню",
    },
    common: {
      learnMore: "Дізнатися більше",
      details: "Деталі",
      register: "Записатися",
      contactUs: "Зв'язатися",
      donate: "Підтримати",
      allCourses: "Усі курси",
      allEvents: "Усі події",
      readArticle: "Читати",
      upcoming: "Найближчі",
      past: "Минулі",
      demo: "Demo",
      emptyTitle: "Поки немає опублікованих матеріалів",
      emptyBody: "Цей стан уже продуманий для майбутнього CMS-контенту.",
    },
    legal: {
      placeholder:
        "Це тимчасовий текст і не є юридичною консультацією. Перед публікацією потрібна перевірка фахівцем.",
      german: "Dies ist ein Platzhalter und keine Rechtsberatung.",
    },
    footer: {
      legal: "Юридична інформація",
      social: "Соціальні мережі",
      demo: "Усі дані на сайті демонстраційні.",
    },
  },
  de: {
    nav: {
      about: "Über uns",
      courses: "Kurse",
      events: "Veranstaltungen",
      news: "Neuigkeiten",
      donate: "Spenden",
      contact: "Kontakt",
      menu: "Menü",
      close: "Menü schließen",
    },
    common: {
      learnMore: "Mehr erfahren",
      details: "Details",
      register: "Anfragen",
      contactUs: "Kontakt aufnehmen",
      donate: "Spenden",
      allCourses: "Alle Kurse",
      allEvents: "Alle Veranstaltungen",
      readArticle: "Lesen",
      upcoming: "Bevorstehend",
      past: "Vergangen",
      demo: "Demo",
      emptyTitle: "Noch keine Inhalte veröffentlicht",
      emptyBody: "Dieser Zustand ist für spätere CMS-Inhalte vorbereitet.",
    },
    legal: {
      placeholder:
        "Dies ist ein Platzhalter und keine Rechtsberatung. Vor Veröffentlichung ist eine rechtliche Prüfung nötig.",
      german: "Dies ist ein Platzhalter und keine Rechtsberatung.",
    },
    footer: {
      legal: "Rechtliches",
      social: "Soziale Netzwerke",
      demo: "Alle Daten auf der Website sind Demo-Inhalte.",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.uk;
}
