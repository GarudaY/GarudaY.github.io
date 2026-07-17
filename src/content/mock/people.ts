import type { Person } from "@/types/content";

export const people: Person[] = [
  {
    id: "person-olena-demo",
    slug: "olena-demo",
    status: "published",
    name: { uk: "Демо Олена К.", de: "Demo Olena K." },
    roleLabel: {
      uk: "Координація освітніх програм",
      de: "Koordination Bildungsprogramme",
    },
    roles: ["board", "team"],
    bio: {
      uk: "Вигаданий профіль для демонстрації сторінки команди. Відповідає за планування курсів і партнерські контакти.",
      de: "Fiktives Profil zur Demonstration der Teamseite. Zuständig für Kursplanung und Partnerkontakte.",
    },
    languages: ["uk", "de", "en"],
    image: {
      src: "/images/generated/person-olena-v1.webp",
      alt: { uk: "Портрет координаторки освітніх програм Олени", de: "Porträt der Bildungskoordinatorin Olena" },
    },
    relatedCourseIds: ["course-german-a1", "course-integration"],
    order: 1,
    isDemo: true,
    seo: {
      title: { uk: "Демо Олена К.", de: "Demo Olena K." },
      description: {
        uk: "Демонстраційний профіль координаторки.",
        de: "Demo-Profil einer Koordinatorin.",
      },
    },
    createdAt: "2026-01-10",
    updatedAt: "2026-06-20",
  },
  {
    id: "person-marko-demo",
    slug: "marko-demo",
    status: "published",
    name: { uk: "Демо Марко Л.", de: "Demo Marko L." },
    roleLabel: { uk: "Викладач німецької мови", de: "Deutschdozent" },
    roles: ["teacher"],
    bio: {
      uk: "Проводить практичні заняття з німецької для повсякденного життя. Профіль є демонстраційним.",
      de: "Leitet praxisnahe Deutschkurse für den Alltag. Dieses Profil ist ein Platzhalter.",
    },
    languages: ["uk", "de"],
    image: {
      src: "/images/generated/person-marko-v1.webp",
      alt: {
        uk: "Портрет викладача німецької мови Марка",
        de: "Porträt des Deutschdozenten Marko",
      },
    },
    relatedCourseIds: ["course-german-a1"],
    order: 2,
    isDemo: true,
    seo: {
      title: { uk: "Демо Марко Л.", de: "Demo Marko L." },
      description: {
        uk: "Демонстраційний профіль викладача.",
        de: "Demo-Profil eines Dozenten.",
      },
    },
    createdAt: "2026-01-11",
    updatedAt: "2026-06-20",
  },
  {
    id: "person-ira-demo",
    slug: "ira-demo",
    status: "published",
    name: { uk: "Демо Ірина С.", de: "Demo Iryna S." },
    roleLabel: {
      uk: "Дитячі творчі заняття",
      de: "Kreativangebote für Kinder",
    },
    roles: ["teacher"],
    bio: {
      uk: "Веде творчі майстерні для дітей 6-10 років. Усі дані профілю вигадані.",
      de: "Leitet Kreativworkshops für Kinder von 6 bis 10 Jahren. Alle Angaben sind fiktiv.",
    },
    languages: ["uk", "de"],
    image: {
      src: "/images/generated/person-iryna-v1.webp",
      alt: {
        uk: "Портрет викладачки творчих занять Ірини",
        de: "Porträt der Kreativdozentin Iryna",
      },
    },
    relatedCourseIds: ["course-children-art", "course-ukrainian-children"],
    order: 3,
    isDemo: true,
    seo: {
      title: { uk: "Демо Ірина С.", de: "Demo Iryna S." },
      description: {
        uk: "Демонстраційний профіль викладачки.",
        de: "Demo-Profil einer Dozentin.",
      },
    },
    createdAt: "2026-01-12",
    updatedAt: "2026-06-20",
  },
  {
    id: "person-sofia-demo",
    slug: "sofia-demo",
    status: "published",
    name: { uk: "Демо Софія М.", de: "Demo Sofiia M." },
    roleLabel: { uk: "Українська мова для дітей", de: "Ukrainisch für Kinder" },
    roles: ["teacher", "volunteer"],
    bio: {
      uk: "Працює з дітьми, які ростуть у двомовному середовищі. Профіль створений для прототипу.",
      de: "Arbeitet mit Kindern in zweisprachigen Familien. Dieses Profil gehört zum Prototyp.",
    },
    languages: ["uk", "de"],
    image: {
      src: "/images/generated/person-sofiia-v1.webp",
      alt: { uk: "Портрет викладачки української мови Софії", de: "Porträt der Ukrainischdozentin Sofiia" },
    },
    relatedCourseIds: ["course-ukrainian-children"],
    order: 4,
    isDemo: true,
    seo: {
      title: { uk: "Демо Софія М.", de: "Demo Sofiia M." },
      description: { uk: "Демонстраційний профіль.", de: "Demo-Profil." },
    },
    createdAt: "2026-01-13",
    updatedAt: "2026-06-20",
  },
  {
    id: "person-andriy-demo",
    slug: "andriy-demo",
    status: "published",
    name: { uk: "Демо Андрій П.", de: "Demo Andrii P." },
    roleLabel: {
      uk: "Правління · інтеграційні програми",
      de: "Vorstand · Integrationsprogramme",
    },
    roles: ["board", "team"],
    bio: {
      uk: "Допомагає структурувати інформаційні зустрічі про побутові та адміністративні теми.",
      de: "Unterstützt Info-Treffen zu Alltag und Verwaltung.",
    },
    languages: ["uk", "de", "en"],
    image: {
      src: "/images/generated/person-andrii-v1.webp",
      alt: {
        uk: "Портрет координатора інтеграційних програм Андрія",
        de: "Porträt des Koordinators für Integrationsprogramme Andrii",
      },
    },
    relatedCourseIds: ["course-integration"],
    order: 5,
    isDemo: true,
    seo: {
      title: { uk: "Демо Андрій П.", de: "Demo Andrii P." },
      description: {
        uk: "Демонстраційний профіль консультанта.",
        de: "Demo-Profil eines Beraters.",
      },
    },
    createdAt: "2026-01-14",
    updatedAt: "2026-06-20",
  },
  {
    id: "person-natalia-demo",
    slug: "natalia-demo",
    status: "published",
    name: { uk: "Демо Наталія Р.", de: "Demo Natalia R." },
    roleLabel: {
      uk: "Правління · культурна програма",
      de: "Vorstand · Kulturprogramm",
    },
    roles: ["board", "team", "volunteer"],
    bio: {
      uk: "Координує культурні зустрічі, читання та спільні святкування. Демонстраційні дані.",
      de: "Koordiniert Kulturtreffen, Lesungen und gemeinsame Feiern. Demo-Daten.",
    },
    languages: ["uk", "de"],
    image: {
      src: "/images/generated/person-natalia-v1.webp",
      alt: {
        uk: "Портрет координаторки культурної програми Наталії",
        de: "Porträt der Kulturkoordinatorin Natalia",
      },
    },
    relatedCourseIds: ["course-choir", "course-culture"],
    order: 6,
    isDemo: true,
    seo: {
      title: { uk: "Демо Наталія Р.", de: "Demo Natalia R." },
      description: {
        uk: "Демонстраційний профіль координаторки.",
        de: "Demo-Profil einer Koordinatorin.",
      },
    },
    createdAt: "2026-01-15",
    updatedAt: "2026-06-20",
  },
];
