import type { Person } from "@/types/content";

const boardImage = {
  src: "/images/brand/sonnenblume-mark.jpg",
  alt: {
    uk: "Символічне зображення SONNENBLUME для профілю правління",
    de: "Symbolische SONNENBLUME-Abbildung für ein Vorstandsprofil",
  },
  fit: "contain" as const,
};

export const people: Person[] = [
  {
    id: "person-olga-pivovarova",
    slug: "olga-pivovarova",
    status: "published",
    name: { uk: "Olga Pivovarova", de: "Olga Pivovarova" },
    roleLabel: {
      uk: "Перша голова правління",
      de: "1. Vorsitzende",
    },
    roles: ["board", "team"],
    bio: {
      uk: "Представляє SONNENBLUME та очолює роботу правління.",
      de: "Vertritt SONNENBLUME und leitet die Vorstandsarbeit.",
    },
    languages: [],
    image: boardImage,
    relatedCourseIds: [],
    order: 1,
    isDemo: false,
    seo: {
      title: { uk: "Olga Pivovarova", de: "Olga Pivovarova" },
      description: {
        uk: "Перша голова правління SONNENBLUME.",
        de: "1. Vorsitzende von SONNENBLUME.",
      },
    },
    createdAt: "2026-07-26",
    updatedAt: "2026-07-26",
  },
  {
    id: "person-oleksandra-zhytnyakova",
    slug: "oleksandra-zhytnyakova",
    status: "published",
    name: { uk: "Oleksandra Zhytnyakova", de: "Oleksandra Zhytnyakova" },
    roleLabel: {
      uk: "Заступниця голови правління",
      de: "Stellvertretende Vorsitzende",
    },
    roles: ["board", "team"],
    bio: {
      uk: "Підтримує координацію та організаційну роботу Verein.",
      de: "Unterstützt die Koordination und organisatorische Arbeit des Vereins.",
    },
    languages: [],
    image: boardImage,
    relatedCourseIds: [],
    order: 2,
    isDemo: false,
    seo: {
      title: { uk: "Oleksandra Zhytnyakova", de: "Oleksandra Zhytnyakova" },
      description: {
        uk: "Заступниця голови правління SONNENBLUME.",
        de: "Stellvertretende Vorsitzende von SONNENBLUME.",
      },
    },
    createdAt: "2026-07-26",
    updatedAt: "2026-07-26",
  },
  {
    id: "person-natalia-petrova",
    slug: "natalia-petrova",
    status: "published",
    name: { uk: "Natalia Petrova", de: "Natalia Petrova" },
    roleLabel: {
      uk: "Скарбниця",
      de: "Schatzmeisterin",
    },
    roles: ["board", "team"],
    bio: {
      uk: "Відповідає за фінансову організацію та прозорість роботи Verein.",
      de: "Verantwortet die finanzielle Organisation und Transparenz des Vereins.",
    },
    languages: [],
    image: boardImage,
    relatedCourseIds: [],
    order: 3,
    isDemo: false,
    seo: {
      title: { uk: "Natalia Petrova", de: "Natalia Petrova" },
      description: {
        uk: "Скарбниця SONNENBLUME.",
        de: "Schatzmeisterin von SONNENBLUME.",
      },
    },
    createdAt: "2026-07-26",
    updatedAt: "2026-07-26",
  },
  {
    id: "person-valentyna-babaian",
    slug: "valentyna-babaian",
    status: "published",
    name: { uk: "Валентина Бабаян", de: "Valentyna Babaian" },
    roleLabel: {
      uk: "Членкиня правління · медіа та зв’язки з громадськістю",
      de: "Vorstandsmitglied · Medien & Öffentlichkeitsarbeit",
    },
    roles: ["board", "team"],
    bio: {
      uk: "Працює у сфері інформаційних технологій та розвиває освітні проєкти, пов’язані зі штучним інтелектом, цифровими навичками й інтеграцією. У SONNENBLUME відповідає за соціальні мережі, інформаційні матеріали, комунікацію та публічне представлення організації.",
      de: "Sie arbeitet im Bereich Informationstechnologie und entwickelt Bildungsprojekte zu künstlicher Intelligenz, digitalen Kompetenzen und Integration. Bei SONNENBLUME verantwortet sie soziale Medien, Informationsmaterialien, Kommunikation und die öffentliche Darstellung des Vereins.",
    },
    languages: [],
    image: {
      src: "/images/people/valentyna-babaian.webp",
      alt: {
        uk: "Портрет Валентини Бабаян",
        de: "Porträt von Valentyna Babaian",
      },
      width: 1440,
      height: 1080,
    },
    relatedCourseIds: [],
    order: 4,
    isDemo: false,
    seo: {
      title: { uk: "Valentyna Babaian", de: "Valentyna Babaian" },
      description: {
        uk: "Членкиня правління SONNENBLUME.",
        de: "Vorstandsmitglied von SONNENBLUME.",
      },
    },
    createdAt: "2026-07-26",
    updatedAt: "2026-07-29",
  },
  {
    id: "person-viktoriia-zhelezniak",
    slug: "viktoriia-zhelezniak",
    status: "published",
    name: { uk: "Вікторія Железняк", de: "Viktoriia Zhelezniak" },
    roleLabel: {
      uk: "Членкиня правління · фінансове планування",
      de: "Vorstandsmitglied · Finanzplanung",
    },
    roles: ["board", "team"],
    bio: {
      uk: "Економістка за фахом. У SONNENBLUME відповідає за фінансове планування, облік і прозоре використання коштів, підтримуючи стабільний розвиток організації та її громадських ініціатив.",
      de: "Sie ist ausgebildete Ökonomin. Bei SONNENBLUME verantwortet sie Finanzplanung, Buchführung und den transparenten Einsatz der Mittel und unterstützt so die stabile Entwicklung des Vereins und seiner Initiativen.",
    },
    languages: [],
    image: {
      src: "/images/people/viktoriia-zhelezniak.webp",
      alt: {
        uk: "Портрет Вікторії Железняк",
        de: "Porträt von Viktoriia Zhelezniak",
      },
      width: 1440,
      height: 1080,
    },
    relatedCourseIds: [],
    order: 5,
    isDemo: false,
    seo: {
      title: { uk: "Вікторія Железняк", de: "Viktoriia Zhelezniak" },
      description: {
        uk: "Членкиня правління SONNENBLUME, фінансове планування.",
        de: "Vorstandsmitglied von SONNENBLUME, Finanzplanung.",
      },
    },
    createdAt: "2026-07-29",
    updatedAt: "2026-07-29",
  },
  {
    id: "person-olena-shulimenko",
    slug: "olena-shulimenko",
    status: "published",
    name: { uk: "Олена Шуліменко", de: "Olena Shulimenko" },
    roleLabel: {
      uk: "Членкиня правління · хореографія та дитячі програми",
      de: "Vorstandsmitglied · Choreografie & Kinderprogramme",
    },
    roles: ["board", "team", "teacher"],
    bio: {
      uk: "Педагогиня-хореографка, балетмейстерка-постановниця та засновниця дитячої хореографічної студії MRIYA. Понад 30 років працює з дітьми й молоддю, поєднуючи професійну хореографію, сучасні методики навчання та популяризацію української культури.",
      de: "Sie ist Choreografie-Pädagogin, Ballettmeisterin und Gründerin des Kinderchoreografie-Studios MRIYA. Seit mehr als 30 Jahren arbeitet sie mit Kindern und Jugendlichen und verbindet professionelle Choreografie, moderne Pädagogik und die Vermittlung ukrainischer Kultur.",
    },
    languages: [],
    image: {
      src: "/images/people/olena-shulimenko.webp",
      alt: {
        uk: "Портрет Олени Шуліменко",
        de: "Porträt von Olena Shulimenko",
      },
      width: 1440,
      height: 1080,
    },
    relatedCourseIds: [],
    order: 6,
    isDemo: false,
    seo: {
      title: { uk: "Олена Шуліменко", de: "Olena Shulimenko" },
      description: {
        uk: "Членкиня правління SONNENBLUME, хореографія та дитячі програми.",
        de: "Vorstandsmitglied von SONNENBLUME, Choreografie und Kinderprogramme.",
      },
    },
    createdAt: "2026-07-29",
    updatedAt: "2026-07-29",
  },
  {
    id: "person-language-programs",
    slug: "language-programs",
    status: "published",
    name: { uk: "Профіль викладача готується", de: "Dozentenprofil folgt" },
    roleLabel: { uk: "Мовні програми", de: "Sprachangebote" },
    roles: ["teacher"],
    bio: {
      uk: "Ім'я та фото буде опубліковано після підтвердження актуальної команди й згоди людини.",
      de: "Name und Foto werden nach Bestätigung des aktuellen Teams und mit Einwilligung veröffentlicht.",
    },
    languages: [],
    image: {
      src: "/images/generated/person-marko-v1.webp",
      alt: {
        uk: "Символічний портрет для мовних програм",
        de: "Symbolisches Porträt für Sprachangebote",
      },
    },
    relatedCourseIds: ["course-german-a1"],
    order: 20,
    isDemo: false,
    seo: {
      title: { uk: "Мовні програми", de: "Sprachangebote" },
      description: {
        uk: "Тимчасовий профіль напряму.",
        de: "Temporäres Bereichsprofil.",
      },
      noIndex: true,
    },
    createdAt: "2026-01-11",
    updatedAt: "2026-07-26",
  },
  {
    id: "person-children-creative-programs",
    slug: "children-creative-programs",
    status: "published",
    name: { uk: "Профіль викладачки готується", de: "Dozentinnenprofil folgt" },
    roleLabel: {
      uk: "Дитячі та творчі програми",
      de: "Kinder- und Kreativangebote",
    },
    roles: ["teacher"],
    bio: {
      uk: "Ім'я та фото буде опубліковано після підтвердження актуальної команди й згоди людини.",
      de: "Name und Foto werden nach Bestätigung des aktuellen Teams und mit Einwilligung veröffentlicht.",
    },
    languages: [],
    image: {
      src: "/images/generated/person-iryna-v1.webp",
      alt: {
        uk: "Символічний портрет для дитячих і творчих програм",
        de: "Symbolisches Porträt für Kinder- und Kreativangebote",
      },
    },
    relatedCourseIds: ["course-children-art", "course-ukrainian-children"],
    order: 21,
    isDemo: false,
    seo: {
      title: { uk: "Дитячі та творчі програми", de: "Kinder- und Kreativangebote" },
      description: {
        uk: "Тимчасовий профіль напряму.",
        de: "Temporäres Bereichsprofil.",
      },
      noIndex: true,
    },
    createdAt: "2026-01-12",
    updatedAt: "2026-07-26",
  },
  {
    id: "person-ukrainian-for-children",
    slug: "ukrainian-for-children",
    status: "published",
    name: { uk: "Профіль викладачки готується", de: "Dozentinnenprofil folgt" },
    roleLabel: { uk: "Українська мова для дітей", de: "Ukrainisch für Kinder" },
    roles: ["teacher"],
    bio: {
      uk: "Ім'я та фото буде опубліковано після підтвердження актуальної команди й згоди людини.",
      de: "Name und Foto werden nach Bestätigung des aktuellen Teams und mit Einwilligung veröffentlicht.",
    },
    languages: [],
    image: {
      src: "/images/generated/person-sofiia-v1.webp",
      alt: {
        uk: "Символічний портрет для дитячої мовної програми",
        de: "Symbolisches Porträt für das Kinder-Sprachangebot",
      },
    },
    relatedCourseIds: ["course-ukrainian-children"],
    order: 22,
    isDemo: false,
    seo: {
      title: { uk: "Українська мова для дітей", de: "Ukrainisch für Kinder" },
      description: {
        uk: "Тимчасовий профіль напряму.",
        de: "Temporäres Bereichsprofil.",
      },
      noIndex: true,
    },
    createdAt: "2026-01-13",
    updatedAt: "2026-07-26",
  },
];
