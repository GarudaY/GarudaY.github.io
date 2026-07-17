import type { Event } from "@/types/content";

export const events: Event[] = [
  {
    id: "event-ukrainian-sunday",
    slug: "ukrainska-nedilya",
    status: "published",
    eventStatus: "upcoming",
    category: "community",
    title: {
      uk: "Українська неділя для родин",
      de: "Ukrainischer Sonntag für Familien",
    },
    summary: {
      uk: "Зустріч для дітей і дорослих: майстерня, знайомство та коротка інформаційна сесія.",
      de: "Treffen für Kinder und Erwachsene: Workshop, Austausch und kurze Info-Session.",
    },
    description: {
      uk: "Подія створена як приклад для майбутнього календаря Verein. Формат поєднує дитячу активність, розмову для батьків і знайомство з командою.",
      de: "Beispielveranstaltung für den künftigen Vereinskalender mit Kinderangebot, Elternaustausch und Teamvorstellung.",
    },
    startsAt: "2026-09-20T14:00:00+02:00",
    endsAt: "2026-09-20T17:00:00+02:00",
    location: { uk: "Demohaus, головна зала", de: "Demohaus, Hauptsaal" },
    price: {
      uk: "вхід вільний, реєстрація бажана",
      de: "Eintritt frei, Anmeldung erwünscht",
    },
    registrationLabel: {
      uk: "Онлайн-реєстрація відкрита",
      de: "Online-Anmeldung geöffnet",
    },
    capacity: 36,
    seatsAvailable: 14,
    contactEmail: "events@example-verein.de",
    image: {
      src: "/images/generated/event-ukrainian-sunday-v1.webp",
      alt: {
        uk: "Родини збираються на Українську неділю у громадському центрі",
        de: "Familien treffen sich zum Ukrainischen Sonntag im Gemeinschaftszentrum",
      },
    },
    gallery: [],
    relatedArticleIds: ["news-open-season"],
    relatedCourseIds: ["course-children-art", "course-german-a1"],
    isFeatured: true,
    seo: {
      title: {
        uk: "Українська неділя для родин",
        de: "Ukrainischer Sonntag für Familien",
      },
      description: {
        uk: "Демонстраційна сімейна подія української громади.",
        de: "Demo-Familienveranstaltung der ukrainischen Community.",
      },
    },
    createdAt: "2026-05-01",
    updatedAt: "2026-06-20",
  },
  {
    id: "event-info-school",
    slug: "info-zustrich-shkola",
    status: "published",
    eventStatus: "upcoming",
    category: "integration",
    title: {
      uk: "Інфозустріч: школа і листи від установ",
      de: "Info-Treffen: Schule und Behördenbriefe",
    },
    summary: {
      uk: "Практична зустріч про те, як читати листи, ставити питання і готуватися до термінів.",
      de: "Praktisches Treffen zu Briefen, Fragen und Vorbereitung auf Termine.",
    },
    description: {
      uk: "Ця зустріч не замінює юридичну консультацію. Вона допомагає краще структурувати питання та знайти відповідні контакти.",
      de: "Das Treffen ersetzt keine Rechtsberatung. Es hilft, Fragen zu strukturieren und passende Anlaufstellen zu finden.",
    },
    startsAt: "2026-10-07T18:00:00+02:00",
    endsAt: "2026-10-07T19:30:00+02:00",
    location: { uk: "Demohaus + online", de: "Demohaus + online" },
    price: { uk: "безкоштовно", de: "kostenfrei" },
    registrationLabel: {
      uk: "Онлайн-реєстрація відкрита",
      de: "Online-Anmeldung geöffnet",
    },
    capacity: 24,
    seatsAvailable: 6,
    contactEmail: "kontakt@example-verein.de",
    image: {
      src: "/images/generated/event-info-school-v1.webp",
      alt: {
        uk: "Батьки обговорюють шкільні листи на інформаційній зустрічі",
        de: "Eltern besprechen Schulbriefe bei einem Info-Treffen",
      },
    },
    gallery: [],
    relatedArticleIds: ["news-integration-materials"],
    relatedCourseIds: ["course-integration"],
    isFeatured: false,
    seo: {
      title: { uk: "Інфозустріч про школу", de: "Info-Treffen Schule" },
      description: {
        uk: "Демонстраційна інтеграційна зустріч.",
        de: "Demo-Integrationstreffen.",
      },
    },
    createdAt: "2026-05-02",
    updatedAt: "2026-06-20",
  },
  {
    id: "event-cultural-evening",
    slug: "vechir-pisen-ta-istoriy",
    status: "published",
    eventStatus: "upcoming",
    category: "culture",
    title: {
      uk: "Вечір пісень та історій",
      de: "Abend der Lieder und Geschichten",
    },
    summary: {
      uk: "Тепла культурна зустріч з піснями, короткими історіями та чаєм.",
      de: "Kulturelles Treffen mit Liedern, kurzen Geschichten und Tee.",
    },
    description: {
      uk: "Подія для тих, хто хоче поділитися сімейними історіями або просто послухати українську музику у дружньому колі.",
      de: "Für alle, die Familiengeschichten teilen oder ukrainische Musik in freundlicher Runde hören möchten.",
    },
    startsAt: "2026-11-14T18:00:00+01:00",
    endsAt: "2026-11-14T20:30:00+01:00",
    location: { uk: "Demohaus, зала", de: "Demohaus, Saal" },
    price: { uk: "донат за можливості", de: "Spende nach Möglichkeit" },
    registrationLabel: {
      uk: "Онлайн-реєстрація відкрита",
      de: "Online-Anmeldung geöffnet",
    },
    capacity: 50,
    seatsAvailable: 28,
    contactEmail: "events@example-verein.de",
    image: {
      src: "/images/generated/event-cultural-evening-v1.webp",
      alt: {
        uk: "Учасники слухають пісню під час камерного культурного вечора",
        de: "Gäste hören bei einem persönlichen Kulturabend einem Lied zu",
      },
    },
    gallery: [],
    relatedArticleIds: [],
    relatedCourseIds: ["course-choir", "course-culture"],
    isFeatured: true,
    seo: {
      title: {
        uk: "Вечір пісень та історій",
        de: "Abend der Lieder und Geschichten",
      },
      description: {
        uk: "Демонстраційна культурна подія.",
        de: "Demo-Kulturveranstaltung.",
      },
    },
    createdAt: "2026-05-03",
    updatedAt: "2026-06-20",
  },
  {
    id: "event-charity-workshop",
    slug: "blagodiyna-maysternya",
    status: "published",
    eventStatus: "upcoming",
    category: "charity",
    title: {
      uk: "Благодійна майстерня листівок",
      de: "Benefiz-Workshop: Karten gestalten",
    },
    summary: {
      uk: "Створюємо листівки та збираємо пожертви на дитячі матеріали.",
      de: "Wir gestalten Karten und sammeln Spenden für Kindermaterialien.",
    },
    description: {
      uk: "Усі платежі в прототипі є placeholder. На реальному сайті подія може містити офіційні способи підтримки.",
      de: "Alle Zahlungsangaben im Prototyp sind Platzhalter. In Produktion können offizielle Spendenwege eingebunden werden.",
    },
    startsAt: "2026-12-05T12:00:00+01:00",
    endsAt: "2026-12-05T15:00:00+01:00",
    location: { uk: "Demohaus, творча кімната", de: "Demohaus, Kreativraum" },
    price: {
      uk: "рекомендований донат 5 EUR, demo",
      de: "empfohlene Spende 5 EUR, Demo",
    },
    registrationLabel: {
      uk: "Залишилося кілька місць",
      de: "Nur noch wenige Plätze",
    },
    capacity: 18,
    seatsAvailable: 2,
    contactEmail: "spenden@example-verein.de",
    image: {
      src: "/images/generated/event-charity-workshop-v1.webp",
      alt: {
        uk: "Дорослі й діти створюють листівки у благодійній майстерні",
        de: "Erwachsene und Kinder gestalten Karten in einem Benefiz-Workshop",
      },
    },
    gallery: [],
    relatedArticleIds: ["news-donation-initiative"],
    relatedCourseIds: ["course-children-art"],
    isFeatured: false,
    seo: {
      title: {
        uk: "Благодійна майстерня листівок",
        de: "Benefiz-Workshop Karten",
      },
      description: {
        uk: "Демонстраційна благодійна подія.",
        de: "Demo-Benefizveranstaltung.",
      },
    },
    createdAt: "2026-05-04",
    updatedAt: "2026-06-20",
  },
  {
    id: "event-spring-meetup",
    slug: "vesnyana-zustrich-2026",
    status: "published",
    eventStatus: "past",
    category: "community",
    title: {
      uk: "Весняна зустріч громади",
      de: "Frühlingstreffen der Community",
    },
    summary: {
      uk: "Архівна demo-подія з майстернями та знайомством нових учасників.",
      de: "Archivierte Demo-Veranstaltung mit Workshops und Kennenlernen.",
    },
    description: {
      uk: "Приклад минулої події для архіву. На продакшені тут можуть бути фото, короткий звіт і пов'язані новини.",
      de: "Beispiel einer vergangenen Veranstaltung für das Archiv mit Fotos, Rückblick und verknüpften Neuigkeiten.",
    },
    startsAt: "2026-04-12T13:00:00+02:00",
    endsAt: "2026-04-12T17:00:00+02:00",
    location: { uk: "Demohaus, подвір'я", de: "Demohaus, Hof" },
    price: { uk: "безкоштовно", de: "kostenfrei" },
    registrationLabel: { uk: "Подія завершена", de: "Veranstaltung beendet" },
    capacity: 40,
    seatsAvailable: 0,
    contactEmail: "events@example-verein.de",
    image: {
      src: "/images/generated/event-spring-meetup-v1.webp",
      alt: {
        uk: "Учасники вітаються на весняній зустрічі громади",
        de: "Gäste begrüßen sich beim Frühlingstreffen der Community",
      },
    },
    gallery: [
      {
        src: "/images/generated/gallery-spring-flowers-v1.webp",
        alt: {
          uk: "Мама з донькою складають весняні квіти у скляні вази",
          de: "Mutter und Tochter arrangieren Frühlingsblumen in Glasvasen",
        },
      },
      {
        src: "/images/generated/gallery-spring-children-v1.webp",
        alt: {
          uk: "Діти малюють за столом разом із волонтеркою",
          de: "Kinder zeichnen gemeinsam mit einer Ehrenamtlichen am Tisch",
        },
      },
      {
        src: "/images/generated/gallery-spring-volunteers-v1.webp",
        alt: {
          uk: "Волонтерки прибирають посуд після весняної зустрічі",
          de: "Ehrenamtliche räumen nach dem Frühlingstreffen Geschirr auf",
        },
      },
    ],
    relatedArticleIds: ["news-spring-recap"],
    relatedCourseIds: [],
    isFeatured: false,
    seo: {
      title: {
        uk: "Весняна зустріч громади",
        de: "Frühlingstreffen der Community",
      },
      description: {
        uk: "Архівна демонстраційна подія.",
        de: "Archivierte Demo-Veranstaltung.",
      },
    },
    createdAt: "2026-04-01",
    updatedAt: "2026-04-15",
  },
];
