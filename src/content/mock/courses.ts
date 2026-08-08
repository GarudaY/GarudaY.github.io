import type { Course } from "@/types/content";

export const courses: Course[] = [
  {
    id: "course-painting-daniil",
    slug: "maliuvannia-daniil-babych",
    status: "published",
    enrollmentStatus: "open",
    category: "creative",
    title: {
      uk: "Курс малювання з Даніїлом Бабичем",
      de: "Malkurs mit Daniil Babych",
    },
    summary: {
      uk: "Регулярне творче заняття для підлітків від 10 до 15 років.",
      de: "Regelmäßiger Kreativkurs für Jugendliche von 10 bis 15 Jahren.",
    },
    description: {
      uk: "На заняттях підлітки знайомляться з художніми техніками, вчаться уважно спостерігати, працювати з формою й кольором та розвивають власну творчу мову.",
      de: "Im Kurs lernen Jugendliche künstlerische Techniken kennen, üben genaues Beobachten, arbeiten mit Form und Farbe und entwickeln ihre eigene kreative Ausdrucksweise.",
    },
    outcomes: {
      uk: [
        "основи композиції та кольору",
        "практика різних художніх технік",
        "власні завершені роботи",
      ],
      de: [
        "Grundlagen von Komposition und Farbe",
        "Praxis mit verschiedenen Techniken",
        "eigene fertige Arbeiten",
      ],
    },
    materials: {
      uk: ["Перелік матеріалів надсилає викладач після запису."],
      de: ["Die Materialliste wird nach der Anmeldung mitgeteilt."],
    },
    ageGroup: { uk: "10–15 років", de: "10–15 Jahre" },
    language: { uk: "українська", de: "Ukrainisch" },
    format: { uk: "очно", de: "vor Ort" },
    location: {
      uk: "Welfenstraße 10, 41238 Mönchengladbach",
      de: "Welfenstraße 10, 41238 Mönchengladbach",
    },
    schedule: [
      {
        weekday: { uk: "середа", de: "Mittwoch" },
        time: "15:30–17:00",
        cadence: { uk: "щотижня", de: "wöchentlich" },
      },
    ],
    price: {
      uk: "Умови запису: kurse@sonnenblume-mg.com",
      de: "Anmeldung: kurse@sonnenblume-mg.com",
    },
    startsAt: "",
    duration: { uk: "регулярне заняття", de: "regelmäßiger Kurs" },
    seatsTotal: 0,
    seatsAvailable: 0,
    teacherIds: ["person-daniil-babych"],
    relatedCourseIds: ["course-choreography-mriya"],
    image: {
      src: "/images/community/children-art-exhibition.jpg",
      alt: {
        uk: "Виставка дитячих художніх робіт SONNENBLUME",
        de: "Ausstellung mit Kinderkunst bei SONNENBLUME",
      },
    },
    isFeatured: true,
    order: 1,
    seo: {
      title: {
        uk: "Курс малювання для підлітків",
        de: "Malkurs für Jugendliche",
      },
      description: {
        uk: "Курс малювання для підлітків 10–15 років у SONNENBLUME.",
        de: "Malkurs für Jugendliche von 10 bis 15 Jahren bei SONNENBLUME.",
      },
    },
    createdAt: "2026-08-08",
    updatedAt: "2026-08-08",
  },
  {
    id: "course-choreography-mriya",
    slug: "khoreohrafiia-studiia-mriya",
    status: "published",
    enrollmentStatus: "open",
    category: "children",
    title: {
      uk: "Хореографічна студія MRIYA",
      de: "Choreografie-Studio MRIYA",
    },
    summary: {
      uk: "Танцювальні заняття з Оленою Шуліменко для двох дитячих вікових груп.",
      de: "Tanzunterricht mit Olena Shulimenko für zwei Altersgruppen.",
    },
    description: {
      uk: "Заняття поєднують професійну хореографічну підготовку, розвиток координації, музикальності, дисципліни та впевненості. Групи сформовані відповідно до віку дітей.",
      de: "Der Unterricht verbindet professionelle choreografische Grundlagen mit Koordination, Musikalität, Disziplin und Selbstvertrauen. Die Gruppen sind nach Alter eingeteilt.",
    },
    outcomes: {
      uk: [
        "координація та відчуття ритму",
        "основи сценічного руху",
        "робота в групі та впевненість",
      ],
      de: [
        "Koordination und Rhythmusgefühl",
        "Grundlagen der Bühnenbewegung",
        "Teamarbeit und Selbstvertrauen",
      ],
    },
    materials: {
      uk: ["Зручний одяг і взуття; деталі повідомляються після запису."],
      de: [
        "Bequeme Kleidung und Schuhe; Details werden nach der Anmeldung mitgeteilt.",
      ],
    },
    ageGroup: { uk: "3–5 та 5–12 років", de: "3–5 und 5–12 Jahre" },
    language: { uk: "українська", de: "Ukrainisch" },
    format: { uk: "очно", de: "vor Ort" },
    location: {
      uk: "Welfenstraße 10, 41238 Mönchengladbach",
      de: "Welfenstraße 10, 41238 Mönchengladbach",
    },
    schedule: [
      {
        weekday: { uk: "п’ятниця · 5–12 років", de: "Freitag · 5–12 Jahre" },
        time: "16:30–18:00",
        cadence: { uk: "щотижня", de: "wöchentlich" },
      },
      {
        weekday: { uk: "п’ятниця · 3–5 років", de: "Freitag · 3–5 Jahre" },
        time: "18:00–19:00",
        cadence: { uk: "щотижня", de: "wöchentlich" },
      },
    ],
    price: {
      uk: "Умови запису: kurse@sonnenblume-mg.com",
      de: "Anmeldung: kurse@sonnenblume-mg.com",
    },
    startsAt: "",
    duration: { uk: "регулярне заняття", de: "regelmäßiger Kurs" },
    seatsTotal: 0,
    seatsAvailable: 0,
    teacherIds: ["person-olena-shulimenko"],
    relatedCourseIds: ["course-painting-daniil"],
    image: {
      src: "/images/community/community-festival.jpg",
      alt: {
        uk: "Дитячий виступ на святі SONNENBLUME",
        de: "Kinderauftritt bei einem Fest von SONNENBLUME",
      },
    },
    isFeatured: true,
    order: 2,
    seo: {
      title: {
        uk: "Хореографічна студія MRIYA",
        de: "Choreografie-Studio MRIYA",
      },
      description: {
        uk: "Танцювальні заняття для дітей у студії MRIYA.",
        de: "Tanzunterricht für Kinder im Studio MRIYA.",
      },
    },
    createdAt: "2026-08-08",
    updatedAt: "2026-08-08",
  },
];
