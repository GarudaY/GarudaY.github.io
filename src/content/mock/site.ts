import type {
  DonationSettings,
  FeaturedContent,
  SiteSettings,
} from "@/types/content";

export const siteSettings: SiteSettings = {
  id: "site-settings",
  name: {
    uk: "SONNENBLUME — Ukraine Community MG e.V.",
    de: "SONNENBLUME — Ukraine Community MG e.V.",
  },
  tagline: {
    uk: "Культура, освіта, інтеграція та взаємопідтримка у Мьонхенгладбаху",
    de: "Kultur, Bildung, Integration und Zusammenhalt in Mönchengladbach",
  },
  description: {
    uk: "SONNENBLUME об'єднує українську громаду Мьонхенгладбаха через культурні й освітні програми, практичну інтеграційну підтримку та волонтерство.",
    de: "SONNENBLUME verbindet die ukrainische Community in Mönchengladbach durch Kultur- und Bildungsangebote, praktische Integrationshilfe und ehrenamtliches Engagement.",
  },
  contact: {
    email: "kontakt@sonnenblume-mg.com",
    address: {
      uk: "Welfenstraße 10, 41238 Mönchengladbach",
      de: "Welfenstraße 10, 41238 Mönchengladbach",
    },
    officeHours: {
      uk: "Зустрічі за попередньою домовленістю",
      de: "Termine nach vorheriger Vereinbarung",
    },
    mapNote: {
      uk: "Перед першим візитом напишіть нам — команда підтвердить час і потрібну контактну особу.",
      de: "Bitte schreiben Sie uns vor dem ersten Besuch. Das Team bestätigt Zeit und Ansprechperson.",
    },
  },
  navigation: [
    {
      label: { uk: "Про нас", de: "Über uns" },
      route: "about",
      priority: "primary",
    },
    {
      label: { uk: "Долучитися", de: "Mitmachen" },
      route: "join",
      priority: "primary",
    },
    {
      label: { uk: "Курси", de: "Kurse" },
      route: "courses",
      priority: "primary",
    },
    {
      label: { uk: "Події", de: "Veranstaltungen" },
      route: "events",
      priority: "primary",
    },
    {
      label: { uk: "Новини", de: "Neuigkeiten" },
      route: "news",
      priority: "primary",
    },
    {
      label: { uk: "Підтримати", de: "Spenden" },
      route: "donate",
      priority: "primary",
    },
    {
      label: { uk: "Контакти", de: "Kontakt" },
      route: "contact",
      priority: "secondary",
    },
  ],
  legalLinks: [
    { label: { uk: "Impressum", de: "Impressum" }, route: "impressum" },
    {
      label: { uk: "Захист даних", de: "Datenschutzerklärung" },
      route: "privacy",
    },
    {
      label: { uk: "Cookie-налаштування", de: "Cookie-Einstellungen" },
      route: "cookies",
    },
  ],
  socialLinks: [
    {
      label: "Instagram",
      href: "https://www.instagram.com/sonnenblume_mg/",
      type: "instagram",
    },
    {
      label: "Website",
      href: "https://sonnenblume-mg.com/",
      type: "website",
    },
  ],
  stats: [
    {
      id: "languages",
      value: "DE · UK",
      label: {
        uk: "двомовна інформація",
        de: "zweisprachige Informationen",
      },
    },
    {
      id: "legal",
      value: "e.V.",
      label: { uk: "зареєстроване об'єднання", de: "eingetragener Verein" },
    },
    {
      id: "location",
      value: "MG",
      label: { uk: "поруч у Мьонхенгладбаху", de: "vor Ort in Mönchengladbach" },
    },
  ],
  seo: {
    title: {
      uk: "SONNENBLUME — українська громада у Мьонхенгладбаху",
      de: "SONNENBLUME — Ukraine Community in Mönchengladbach",
    },
    description: {
      uk: "Культурні та освітні програми, інтеграційна підтримка, події й волонтерство для української громади Мьонхенгладбаха.",
      de: "Kultur- und Bildungsangebote, Integrationshilfe, Veranstaltungen und Ehrenamt für die ukrainische Community in Mönchengladbach.",
    },
  },
};

export const featuredContent: FeaturedContent[] = [
  {
    id: "featured-course",
    type: "course",
    title: {
      uk: "Відкрито набір на німецьку для повсякденного життя",
      de: "Anmeldung für Deutsch im Alltag geöffnet",
    },
    summary: {
      uk: "Практичний курс для спілкування з лікарем, школою, Jobcenter та сусідами.",
      de: "Praktischer Kurs für Termine, Schule, Jobcenter und Alltag.",
    },
    hrefRoute: "courses",
    slug: "nimetska-dlya-zhyttya-a1-a2",
    badge: { uk: "Набір відкрито", de: "Anmeldung offen" },
  },
  {
    id: "featured-event",
    type: "event",
    title: {
      uk: "Сімейна зустріч: українська неділя",
      de: "Familientreffen: Ukrainischer Sonntag",
    },
    summary: {
      uk: "Майстерня для дітей, знайомство для батьків і коротка інформаційна сесія.",
      de: "Workshop für Kinder, Austausch für Eltern und kurze Info-Session.",
    },
    hrefRoute: "events",
    slug: "ukrainska-nedilya",
    badge: { uk: "Найближча подія", de: "Nächste Veranstaltung" },
  },
  {
    id: "featured-donation",
    type: "donation",
    title: {
      uk: "Підтримайте дитячі та мовні програми",
      de: "Kinder- und Sprachprogramme unterstützen",
    },
    summary: {
      uk: "Кошти йдуть на матеріали, оренду залів і стипендійні місця.",
      de: "Spenden helfen bei Material, Räumen und geförderten Plätzen.",
    },
    hrefRoute: "donate",
    badge: { uk: "Поточна ініціатива", de: "Aktuelle Initiative" },
  },
];

export const donationSettings: DonationSettings = {
  title: {
    uk: "Підтримати SONNENBLUME",
    de: "SONNENBLUME unterstützen",
  },
  description: {
    uk: "Пожертви допомагають фінансувати матеріали, приміщення та доступні програми для громади. Переказ надходить безпосередньо на рахунок Verein.",
    de: "Spenden helfen bei Materialien, Räumen und zugänglichen Community-Angeboten. Die Überweisung geht direkt auf das Vereinskonto.",
  },
  impact: {
    uk: [
      "навчальні матеріали для дитячих занять",
      "часткова оплата приміщень для подій",
      "пільгові місця на мовних курсах",
      "підтримка волонтерських ініціатив",
    ],
    de: [
      "Lernmaterialien für Kinderangebote",
      "Raumkosten für Veranstaltungen",
      "geförderte Plätze in Sprachkursen",
      "Unterstützung ehrenamtlicher Initiativen",
    ],
  },
  methods: [
    {
      id: "bank-transfer",
      type: "bank",
      title: { uk: "Банківський переказ", de: "Banküberweisung" },
      description: {
        uk: "Прямий переказ на рахунок SONNENBLUME у Stadtsparkasse Mönchengladbach.",
        de: "Direkte Überweisung auf das Konto von SONNENBLUME bei der Stadtsparkasse Mönchengladbach.",
      },
      details: {
        uk: [
          "IBAN: DE83 3105 0000 1004 2098 37",
          "BIC: MGLSDE33XXX",
          "Призначення: Spende",
        ],
        de: [
          "IBAN: DE83 3105 0000 1004 2098 37",
          "BIC: MGLSDE33XXX",
          "Verwendungszweck: Spende",
        ],
      },
      isDemo: false,
    },
    {
      id: "in-kind-and-time",
      type: "in-kind",
      title: { uk: "Час і практична допомога", de: "Zeit und praktische Hilfe" },
      description: {
        uk: "Матеріали, експертні години, приміщення або допомога на подіях — після короткого узгодження з командою.",
        de: "Materialien, Fachstunden, Räume oder Hilfe bei Veranstaltungen – nach kurzer Abstimmung mit dem Team.",
      },
      details: {
        uk: ["Опис пропозиції можна надіслати через структуровану контактну форму."],
        de: ["Angebote können über das strukturierte Kontaktformular beschrieben werden."],
      },
      isDemo: false,
    },
  ],
  seo: {
    title: { uk: "Підтримати SONNENBLUME", de: "SONNENBLUME unterstützen" },
    description: {
      uk: "Банківський переказ, волонтерський час і практична допомога для SONNENBLUME.",
      de: "Banküberweisung, ehrenamtliche Zeit und praktische Hilfe für SONNENBLUME.",
    },
  },
};
