import type { NewsArticle } from "@/types/content";

export const newsArticles: NewsArticle[] = [
  {
    id: "news-open-season",
    slug: "vidkryto-osinniy-sezon",
    status: "published",
    title: {
      uk: "Відкриваємо осінній сезон курсів і зустрічей",
      de: "Herbstsaison mit Kursen und Treffen startet",
    },
    excerpt: {
      uk: "У demo-календарі з'явилися мовні курси, дитячі заняття та кілька подій для громади.",
      de: "Im Demo-Kalender stehen Sprachkurse, Kinderangebote und Community-Veranstaltungen.",
    },
    body: {
      uk: [
        "Ця новина демонструє, як Verein може публікувати короткі оголошення про сезонні програми.",
        "Усі дати, імена та реквізити в прототипі є вигаданими. Структура підготовлена так, щоб редактор міг додати реальний текст у CMS.",
      ],
      de: [
        "Diese Meldung zeigt, wie der Verein saisonale Programme ankündigen kann.",
        "Alle Termine, Namen und Angaben im Prototyp sind fiktiv. Die Struktur ist für echte CMS-Inhalte vorbereitet.",
      ],
    },
    publishedAt: "2026-07-01",
    author: { uk: "Команда Verein, demo", de: "Vereinsteam, Demo" },
    image: {
      src: "/images/generated/news-autumn-season-v1.webp",
      alt: {
        uk: "Волонтери готують навчальні матеріали до осіннього сезону",
        de: "Ehrenamtliche bereiten Lernmaterialien für die Herbstsaison vor",
      },
    },
    relatedEventIds: ["event-ukrainian-sunday"],
    relatedCourseIds: ["course-german-a1", "course-children-art"],
    isFeatured: true,
    seo: {
      title: { uk: "Відкриваємо осінній сезон", de: "Herbstsaison startet" },
      description: {
        uk: "Демонстраційна новина про старт курсів і зустрічей.",
        de: "Demo-Meldung zum Start der Kurse und Treffen.",
      },
    },
    createdAt: "2026-06-25",
    updatedAt: "2026-07-01",
  },
  {
    id: "news-integration-materials",
    slug: "materialy-dlya-integratsiynykh-zustrichey",
    status: "published",
    title: {
      uk: "Готуємо матеріали для інтеграційних зустрічей",
      de: "Materialien für Integrationstreffen werden vorbereitet",
    },
    excerpt: {
      uk: "На сторінках подій і курсів можна буде пов'язувати матеріали, викладачів і новини.",
      de: "Veranstaltungen, Kurse, Personen und Meldungen können miteinander verknüpft werden.",
    },
    body: {
      uk: [
        "Матеріали допоможуть учасникам готувати питання до зустрічей і краще розуміти щоденні процеси.",
        "У майбутній CMS ця новина може бути пов'язана з конкретною подією або курсом.",
      ],
      de: [
        "Die Materialien helfen Teilnehmenden, Fragen vorzubereiten und Alltagsprozesse besser zu verstehen.",
        "In der künftigen CMS kann diese Meldung mit einer Veranstaltung oder einem Kurs verknüpft werden.",
      ],
    },
    publishedAt: "2026-06-18",
    author: { uk: "Редакція, demo", de: "Redaktion, Demo" },
    image: {
      src: "/images/generated/news-integration-materials-v1.webp",
      alt: {
        uk: "Координатори впорядковують матеріали для інтеграційних зустрічей",
        de: "Koordinierende ordnen Materialien für Integrationstreffen",
      },
    },
    relatedEventIds: ["event-info-school"],
    relatedCourseIds: ["course-integration"],
    isFeatured: false,
    seo: {
      title: {
        uk: "Матеріали для інтеграційних зустрічей",
        de: "Materialien für Integrationstreffen",
      },
      description: {
        uk: "Демонстраційна новина про інтеграційні матеріали.",
        de: "Demo-Meldung zu Integrationsmaterialien.",
      },
    },
    createdAt: "2026-06-10",
    updatedAt: "2026-06-18",
  },
  {
    id: "news-donation-initiative",
    slug: "initsiatyva-dytyachi-materialy",
    status: "published",
    title: {
      uk: "Поточна ініціатива: матеріали для дитячих занять",
      de: "Aktuelle Initiative: Materialien für Kinderangebote",
    },
    excerpt: {
      uk: "Приклад того, як сайт може пояснювати мету пожертв і підвищувати довіру.",
      de: "Beispiel dafür, wie die Website Spendenziele transparent erklären kann.",
    },
    body: {
      uk: [
        "Блок пожертв не підключає реальні платежі, але показує майбутню структуру: призначення, способи підтримки і юридичні попередження.",
        "Перед запуском треба додати справжні реквізити, перевірити тексти та підключити consent management лише за потреби.",
      ],
      de: [
        "Der Spendenbereich enthält keine echten Zahlungen, zeigt aber die künftige Struktur: Zweck, Wege der Unterstützung und rechtliche Hinweise.",
        "Vor dem Launch müssen echte Zahlungsdaten, geprüfte Texte und nur bei Bedarf Consent Management ergänzt werden.",
      ],
    },
    publishedAt: "2026-06-05",
    author: { uk: "Команда пожертв, demo", de: "Spendenteam, Demo" },
    image: {
      src: "/images/generated/news-children-materials-v1.webp",
      alt: {
        uk: "Волонтерка розкладає нові художні матеріали для дитячих занять",
        de: "Eine Ehrenamtliche sortiert neue Kreativmaterialien für Kinderangebote",
      },
    },
    relatedEventIds: ["event-charity-workshop"],
    relatedCourseIds: ["course-children-art", "course-ukrainian-children"],
    isFeatured: true,
    seo: {
      title: {
        uk: "Матеріали для дитячих занять",
        de: "Materialien für Kinderangebote",
      },
      description: {
        uk: "Демонстраційна новина про благодійну ініціативу.",
        de: "Demo-Meldung zu einer Spendeninitiative.",
      },
    },
    createdAt: "2026-06-01",
    updatedAt: "2026-06-05",
  },
  {
    id: "news-spring-recap",
    slug: "yak-proyshla-vesnyana-zustrich",
    status: "published",
    title: {
      uk: "Як пройшла весняна зустріч громади",
      de: "Rückblick auf das Frühlingstreffen",
    },
    excerpt: {
      uk: "Архівна demo-новина для минулих подій і майбутніх галерей.",
      de: "Archivierte Demo-Meldung für vergangene Veranstaltungen und künftige Galerien.",
    },
    body: {
      uk: [
        "У реальному контенті тут можна додати фото, короткий звіт і подяки волонтерам.",
        "Поки що сторінка демонструє структуру новини без випадкових реальних фотографій.",
      ],
      de: [
        "In echten Inhalten können hier Fotos, ein kurzer Rückblick und Dank an Freiwillige stehen.",
        "Aktuell demonstriert die Seite die Struktur ohne zufällige echte Fotos.",
      ],
    },
    publishedAt: "2026-04-16",
    author: { uk: "Команда подій, demo", de: "Veranstaltungsteam, Demo" },
    image: {
      src: "/images/generated/news-spring-recap-v1.webp",
      alt: {
        uk: "Родини спілкуються за чаєм на весняній зустрічі громади",
        de: "Familien unterhalten sich bei Tee beim Frühlingstreffen der Community",
      },
    },
    relatedEventIds: ["event-spring-meetup"],
    relatedCourseIds: [],
    isFeatured: false,
    seo: {
      title: {
        uk: "Весняна зустріч громади",
        de: "Frühlingstreffen Rückblick",
      },
      description: {
        uk: "Демонстраційний звіт про минулу подію.",
        de: "Demo-Rückblick auf eine vergangene Veranstaltung.",
      },
    },
    createdAt: "2026-04-13",
    updatedAt: "2026-04-16",
  },
];
