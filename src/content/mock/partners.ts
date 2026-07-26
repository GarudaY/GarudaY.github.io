import type { Partner } from "@/types/content";

export const partners: Partner[] = [
  {
    id: "partner-dsee",
    name: "Deutsche Stiftung für Engagement und Ehrenamt",
    status: "published",
    description: {
      uk: "Підтримує проєкт «Digitale Brücken bauen» для нової багатомовної вебсторінки та залучення волонтерів.",
      de: "Fördert das Projekt „Digitale Brücken bauen“ für die neue mehrsprachige Website und die Gewinnung von Ehrenamtlichen.",
    },
    website: "https://www.deutsche-stiftung-engagement-und-ehrenamt.de/",
    logo: {
      src: "/images/partners/dsee-foerderlogo.svg",
      alt: {
        uk: "Gefördert durch Deutsche Stiftung für Engagement und Ehrenamt",
        de: "Gefördert durch Deutsche Stiftung für Engagement und Ehrenamt",
      },
    },
    order: 1,
  },
  {
    id: "partner-landesmusikrat-nrw",
    name: "Landesmusikrat NRW",
    status: "published",
    description: {
      uk: "Партнер культурних і музичних ініціатив у Північному Рейні-Вестфалі.",
      de: "Partner für kulturelle und musikalische Initiativen in Nordrhein-Westfalen.",
    },
    website: "https://www.lmr-nrw.de/",
    logo: {
      src: "/images/partners/landesmusikrat-nrw.png",
      alt: { uk: "Логотип Landesmusikrat NRW", de: "Logo Landesmusikrat NRW" },
    },
    order: 2,
  },
  {
    id: "partner-komm-an-nrw",
    name: "KOMM-AN NRW",
    status: "published",
    description: {
      uk: "Підтримка інтеграції, зустрічей та локальної волонтерської роботи.",
      de: "Unterstützung für Integration, Begegnung und lokales ehrenamtliches Engagement.",
    },
    website: "https://www.mkjfgfi.nrw/komm-an-nrw",
    logo: {
      src: "/images/partners/komm-an-nrw.png",
      alt: { uk: "Логотип KOMM-AN NRW", de: "Logo KOMM-AN NRW" },
    },
    order: 3,
  },
  {
    id: "partner-ki-moenchengladbach",
    name: "Kommunales Integrationszentrum Mönchengladbach",
    status: "published",
    description: {
      uk: "Локальна співпраця у питаннях інтеграції та доступу до інформації.",
      de: "Lokale Zusammenarbeit zu Integration und Informationszugang.",
    },
    logo: {
      src: "/images/partners/kommunales-integrationszentrum-mg.png",
      alt: {
        uk: "Логотип Kommunales Integrationszentrum Mönchengladbach",
        de: "Logo Kommunales Integrationszentrum Mönchengladbach",
      },
    },
    order: 4,
  },
  {
    id: "partner-aktion-mensch",
    name: "Aktion Mensch",
    status: "published",
    description: {
      uk: "Підтримка доступної участі, різноманіття та інклюзивних форматів.",
      de: "Unterstützung für zugängliche Teilhabe, Vielfalt und inklusive Formate.",
    },
    website: "https://www.aktion-mensch.de/",
    logo: {
      src: "/images/partners/aktion-mensch.png",
      alt: { uk: "Логотип Aktion Mensch", de: "Logo Aktion Mensch" },
    },
    order: 5,
  },
  {
    id: "partner-gemeinsam-vielfalt",
    name: "Gemeinsam. Vielfalt.",
    status: "published",
    description: {
      uk: "Співпраця заради різноманіття, взаємної поваги та суспільної єдності.",
      de: "Zusammenarbeit für Vielfalt, gegenseitigen Respekt und gesellschaftlichen Zusammenhalt.",
    },
    logo: {
      src: "/images/partners/gemeinsam-vielfalt.png",
      alt: { uk: "Логотип Gemeinsam. Vielfalt.", de: "Logo Gemeinsam. Vielfalt." },
    },
    order: 6,
  },
  {
    id: "partner-zirkus-macht-stark",
    name: "Zirkus macht stark",
    status: "published",
    description: {
      uk: "Творчі освітні формати для дітей і молоді в межах «Kultur macht stark».",
      de: "Kreative Bildungsformate für Kinder und Jugendliche im Rahmen von „Kultur macht stark“.",
    },
    website: "https://www.zirkus-macht-stark.de/",
    logo: {
      src: "/images/partners/zirkus-macht-stark.png",
      alt: { uk: "Логотип Zirkus macht stark", de: "Logo Zirkus macht stark" },
    },
    order: 7,
  },
];
