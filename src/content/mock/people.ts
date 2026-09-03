import type { Person } from "@/types/content";

export const people: Person[] = [
  {
    id: "person-natalia-petrova",
    slug: "natalia-petrova",
    status: "published",
    name: { uk: "Наталія Петрова", de: "Natalia Petrova" },
    roleLabel: {
      uk: "Голова правління",
      de: "Vorstandsvorsitzende",
    },
    teacherRoleLabel: {
      uk: "Викладачка німецької мови",
      de: "Kursleitung Deutsch",
    },
    roles: ["board", "team", "teacher"],
    bio: {
      uk: "Наталія має багаторічний досвід у сфері освіти та перекладу, а останні роки працює в міжнародному бізнесі, займаючись організацією та управлінням бізнес-процесами. Як голова правління SONNENBLUME вона відповідає за стратегічний розвиток організації, ініціює нові проєкти, розвиває партнерства, координує роботу команди та представляє об’єднання назовні. Для Наталії важливо, щоб SONNENBLUME об’єднувала українців, зберігала українську культуру та водночас відкривала Україну німецькому суспільству. Одну з головних місій організації вона бачить у побудові живого мосту між українською та німецькою спільнотами — мосту, що сприяє взаєморозумінню, довірі та довготривалій підтримці України. У вільний час Наталія любить подорожі, довгі прогулянки, книги, хороше кіно та зустрічі з друзями.",
      de: "Natalia verfügt über langjährige Erfahrung in Bildung und Übersetzung und arbeitet seit mehreren Jahren im internationalen Geschäft, wo sie Geschäftsprozesse organisiert und steuert. Als Vorstandsvorsitzende von SONNENBLUME verantwortet sie die strategische Entwicklung des Vereins, initiiert neue Projekte, baut Partnerschaften auf, koordiniert die Teamarbeit und vertritt den Verein nach außen. Ihr ist wichtig, dass SONNENBLUME Menschen aus der Ukraine verbindet, ukrainische Kultur bewahrt und zugleich die Ukraine für die deutsche Gesellschaft erlebbar macht. Eine zentrale Aufgabe des Vereins sieht sie darin, eine lebendige Brücke zwischen der ukrainischen und der deutschen Gemeinschaft zu bauen – für Verständigung, Vertrauen und langfristige Unterstützung der Ukraine. In ihrer Freizeit reist Natalia gern, unternimmt lange Spaziergänge, liest, schaut gute Filme und trifft Freunde.",
    },
    teacherBio: {
      uk: "Веде курс німецької мови у SONNENBLUME та допомагає учасникам упевненіше користуватися мовою в повсякденних ситуаціях.",
      de: "Sie leitet bei SONNENBLUME den Deutschkurs und unterstützt die Teilnehmenden dabei, Deutsch im Alltag sicherer anzuwenden.",
    },
    image: {
      src: "/images/people/natalia-petrova.webp",
      alt: {
        uk: "Портрет Наталії Петрової",
        de: "Porträt von Natalia Petrova",
      },
      width: 1200,
      height: 1600,
    },
    languages: [],
    relatedCourseIds: ["course-german"],
    order: 1,
    isDemo: false,
    seo: {
      title: { uk: "Наталія Петрова", de: "Natalia Petrova" },
      description: {
        uk: "Голова правління SONNENBLUME.",
        de: "Vorstandsvorsitzende von SONNENBLUME.",
      },
    },
    createdAt: "2026-07-26",
    updatedAt: "2026-08-16",
  },
  {
    id: "person-mariya-kaplunovska",
    slug: "mariya-kaplunovska",
    status: "published",
    name: { uk: "Марія Каплуновська", de: "Mariya Kaplunovska" },
    roleLabel: {
      uk: "Заступниця голови правління",
      de: "Stellvertretende Vorsitzende",
    },
    roles: ["board", "team"],
    bio: {
      uk: "Підтримує координацію правління та організаційну роботу SONNENBLUME.",
      de: "Sie unterstützt die Koordination des Vorstands und die organisatorische Arbeit von SONNENBLUME.",
    },
    languages: [],
    relatedCourseIds: [],
    order: 2,
    isDemo: false,
    seo: {
      title: { uk: "Марія Каплуновська", de: "Mariya Kaplunovska" },
      description: {
        uk: "Заступниця голови правління SONNENBLUME.",
        de: "Stellvertretende Vorsitzende von SONNENBLUME.",
      },
    },
    createdAt: "2026-08-08",
    updatedAt: "2026-08-08",
  },
  {
    id: "person-viktoriia-zhelezniak",
    slug: "viktoriia-zhelezniak",
    status: "published",
    name: { uk: "Вікторія Железняк", de: "Viktoriia Zhelezniak" },
    roleLabel: {
      uk: "Скарбниця",
      de: "Schatzmeisterin",
    },
    roles: ["board", "team"],
    bio: {
      uk: "Вікторія Железняк за професією економістка. Як скарбниця організації, вона відповідає за фінансове планування, ведення обліку та прозоре використання коштів. Для неї особливе значення має можливість підтримувати важливі проєкти та сприяти стабільному розвитку українсько-німецької спільноти.",
      de: "Viktoriia Zhelezniak ist ausgebildete Ökonomin. Als Schatzmeisterin verantwortet sie Finanzplanung, Buchführung und den transparenten Einsatz der Mittel. Besonders wichtig ist ihr, bedeutende Projekte zu unterstützen und zur stabilen Entwicklung der ukrainisch-deutschen Gemeinschaft beizutragen.",
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
    order: 3,
    isDemo: false,
    seo: {
      title: { uk: "Вікторія Железняк", de: "Viktoriia Zhelezniak" },
      description: {
        uk: "Скарбниця SONNENBLUME.",
        de: "Schatzmeisterin von SONNENBLUME.",
      },
    },
    createdAt: "2026-07-29",
    updatedAt: "2026-08-08",
  },
  {
    id: "person-valentyna-babaian",
    slug: "valentyna-babaian",
    status: "published",
    name: { uk: "Валентина Бабаян", de: "Valentyna Babaian" },
    roleLabel: {
      uk: "Зв’язки з громадськістю",
      de: "Öffentlichkeitsarbeit",
    },
    roles: ["board", "team"],
    bio: {
      uk: "Валентина працює у сфері інформаційних технологій та займається освітніми проєктами, пов’язаними зі штучним інтелектом, цифровими навичками й інтеграцією. У SONNENBLUME вона відповідає за соціальні мережі, інформаційні матеріали, комунікацію та представлення діяльності об’єднання у публічному просторі.",
      de: "Valentyna arbeitet im Bereich Informationstechnologie und entwickelt Bildungsprojekte zu künstlicher Intelligenz, digitalen Kompetenzen und Integration. Bei SONNENBLUME verantwortet sie soziale Medien, Informationsmaterialien, Kommunikation und die öffentliche Darstellung des Vereins.",
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
      title: { uk: "Валентина Бабаян", de: "Valentyna Babaian" },
      description: {
        uk: "Зв’язки з громадськістю у правлінні SONNENBLUME.",
        de: "Öffentlichkeitsarbeit im Vorstand von SONNENBLUME.",
      },
    },
    createdAt: "2026-07-26",
    updatedAt: "2026-08-08",
  },
  {
    id: "person-olga-zubchyk",
    slug: "olga-zubchyk",
    status: "published",
    name: { uk: "Ольга Зубчик", de: "Olga Zubchyk" },
    roleLabel: {
      uk: "Керівниця проєктів для дітей та молоді",
      de: "Leitung Kinder- und Jugendprojekte",
    },
    teacherRoleLabel: {
      uk: "Викладачка арифметики",
      de: "Kursleitung Arithmetik",
    },
    roles: ["board", "team", "teacher"],
    bio: {
      uk: "Координує у SONNENBLUME проєкти для дітей і молоді та допомагає розвивати їхню програму.",
      de: "Sie koordiniert bei SONNENBLUME Projekte für Kinder und Jugendliche und entwickelt deren Programm weiter.",
    },
    teacherBio: {
      uk: "Веде заняття з арифметики для дітей у SONNENBLUME.",
      de: "Sie leitet bei SONNENBLUME den Arithmetikunterricht für Kinder.",
    },
    languages: [],
    relatedCourseIds: [],
    order: 5,
    isDemo: false,
    seo: {
      title: { uk: "Ольга Зубчик", de: "Olga Zubchyk" },
      description: {
        uk: "Керівниця проєктів для дітей та молоді SONNENBLUME.",
        de: "Leitung der Kinder- und Jugendprojekte bei SONNENBLUME.",
      },
    },
    createdAt: "2026-08-08",
    updatedAt: "2026-08-09",
  },
  {
    id: "person-olena-shulimenko",
    slug: "olena-shulimenko",
    status: "published",
    name: { uk: "Олена Шуліменко", de: "Olena Shulimenko" },
    roleLabel: {
      uk: "Педагогиня-хореографка · студія MRIYA",
      de: "Choreografie-Pädagogin · Studio MRIYA",
    },
    roles: ["teacher"],
    bio: {
      uk: "Педагогиня-хореографка, балетмейстерка-постановниця, суддя всеукраїнських і міжнародних хореографічних конкурсів та засновниця дитячої студії MRIYA. Понад 30 років Олена працює з дітьми й молоддю. Вона поєднує професійну хореографію, сучасні методики навчання та популяризацію української культури, допомагаючи дітям розвивати дисципліну, творче мислення, відповідальність і впевненість у собі.",
      de: "Olena ist Choreografie-Pädagogin, Ballettmeisterin, Jurorin ukrainischer und internationaler Tanzwettbewerbe sowie Gründerin des Kinderstudios MRIYA. Seit mehr als 30 Jahren arbeitet sie mit Kindern und Jugendlichen. Sie verbindet professionelle Choreografie, moderne Pädagogik und die Vermittlung ukrainischer Kultur und stärkt dabei Disziplin, Kreativität, Verantwortung und Selbstvertrauen.",
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
    relatedCourseIds: ["course-choreography-mriya"],
    order: 10,
    isDemo: false,
    seo: {
      title: { uk: "Олена Шуліменко", de: "Olena Shulimenko" },
      description: {
        uk: "Педагогиня-хореографка дитячої студії MRIYA.",
        de: "Choreografie-Pädagogin des Kinderstudios MRIYA.",
      },
    },
    createdAt: "2026-07-29",
    updatedAt: "2026-08-08",
  },
  {
    id: "person-daniil-babych",
    slug: "daniil-babych",
    status: "published",
    name: { uk: "Даніїл Бабич", de: "Daniil Babych" },
    roleLabel: {
      uk: "Викладач курсу малювання",
      de: "Kursleitung Malerei",
    },
    roles: ["teacher"],
    bio: {
      uk: "Даніїл Бабич родом з України. З дитинства він любив малювати та навчався в Академії мистецтв імені Сальвадора Далі. Основний напрям його творчості — реалістичний живопис, особливо портрети. Він працює з олійними фарбами, акрилом та іншими художніми матеріалами, бере участь у мистецьких проєктах, виставках і фестивалях та працював разом із Gregor Wosik, Daniela Löch і Beate Krempe. Творчість і волонтерство завжди були важливою частиною його життя. На заняттях він допомагає дітям і підліткам не лише опановувати малювання, ліплення й різні творчі техніки, а й розвивати уяву, впевненість у власних силах і сміливість у самовираженні.",
      de: "Daniil Babych stammt aus der Ukraine. Seit seiner Kindheit zeichnet er und entwickelte seine künstlerischen Fähigkeiten an der Salvador-Dalí-Kunstakademie weiter. Sein Schwerpunkt ist realistische Malerei, besonders das Porträt. Er arbeitet mit Öl, Acryl und weiteren Materialien, beteiligt sich an Kunstprojekten, Ausstellungen und Festivals und arbeitete unter anderem mit Gregor Wosik, Daniela Löch und Beate Krempe. Kreativität und Ehrenamt sind für ihn wichtige Bestandteile seines Lebens. Im Unterricht vermittelt er Kindern und Jugendlichen nicht nur Zeichnen, Modellieren und verschiedene kreative Techniken, sondern stärkt auch Fantasie, Selbstvertrauen und Freude am eigenen Ausdruck. Jüngere Kinder entdecken Farben und Materialien, ältere beschäftigen sich mit Perspektive, Proportionen und Grundlagen der bildenden Kunst.",
    },
    image: {
      src: "/images/people/daniil-babych.webp",
      alt: {
        uk: "Портрет Даніїла Бабича",
        de: "Porträt von Daniil Babych",
      },
      width: 1200,
      height: 900,
    },
    languages: [],
    relatedCourseIds: ["course-painting-daniil"],
    order: 11,
    isDemo: false,
    seo: {
      title: { uk: "Даніїл Бабич", de: "Daniil Babych" },
      description: {
        uk: "Викладач курсу малювання у SONNENBLUME.",
        de: "Kursleitung Malerei bei SONNENBLUME.",
      },
    },
    createdAt: "2026-08-08",
    updatedAt: "2026-08-16",
  },
];
