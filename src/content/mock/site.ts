import type {
  DonationSettings,
  FeaturedContent,
  SiteSettings,
} from "@/types/content";

export const siteSettings: SiteSettings = {
  id: "site-settings",
  name: {
    uk: "Український Verein у Німеччині",
    de: "Ukrainischer Verein in Deutschland",
  },
  tagline: {
    uk: "Курси, події та підтримка для української спільноти",
    de: "Kurse, Veranstaltungen und Unterstützung für die ukrainische Community",
  },
  description: {
    uk: "Демо-сайт громадського об'єднання, яке допомагає українцям у Німеччині навчатися, зустрічатися та зберігати культурний зв'язок.",
    de: "Demo-Website eines Vereins, der Ukrainerinnen und Ukrainer in Deutschland mit Kursen, Begegnungen und Kulturangeboten unterstützt.",
  },
  contact: {
    email: "kontakt@example-verein.de",
    phone: "+49 000 000000",
    address: {
      uk: "Demohaus, Musterstrasse 12, 00000 Musterstadt",
      de: "Demohaus, Musterstrasse 12, 00000 Musterstadt",
    },
    officeHours: {
      uk: "Вівторок і четвер, 15:00-18:00",
      de: "Dienstag und Donnerstag, 15:00-18:00 Uhr",
    },
    mapNote: {
      uk: "Адреса демонстраційна. Перед публікацією її потрібно підтвердити та додати privacy-friendly карту.",
      de: "Die Adresse ist fiktiv. Vor Veröffentlichung bitte bestätigen und eine datensparsame Karte ergänzen.",
    },
  },
  navigation: [
    {
      label: { uk: "Про нас", de: "Über uns" },
      route: "about",
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
      href: "https://example.com/instagram-demo",
      type: "instagram",
    },
    {
      label: "Facebook",
      href: "https://example.com/facebook-demo",
      type: "facebook",
    },
    {
      label: "Telegram",
      href: "https://example.com/telegram-demo",
      type: "telegram",
    },
  ],
  stats: [
    {
      id: "courses",
      value: "18+",
      label: {
        uk: "курсів і регулярних занять",
        de: "Kurse und regelmäßige Angebote",
      },
    },
    {
      id: "events",
      value: "60+",
      label: { uk: "подій для громади", de: "Community-Veranstaltungen" },
    },
    {
      id: "families",
      value: "350+",
      label: { uk: "учасників у demo-даних", de: "Teilnehmende in Demo-Daten" },
    },
  ],
  seo: {
    title: {
      uk: "Український Verein у Німеччині",
      de: "Ukrainischer Verein in Deutschland",
    },
    description: {
      uk: "Курси, події, інтеграційна підтримка та благодійні ініціативи для українців у Німеччині.",
      de: "Kurse, Veranstaltungen, Integrationshilfe und Spendeninitiativen für Ukrainerinnen und Ukrainer in Deutschland.",
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
    uk: "Підтримати роботу Verein",
    de: "Die Vereinsarbeit unterstützen",
  },
  description: {
    uk: "Пожертви допомагають робити курси доступнішими, оплачувати матеріали та підтримувати події для громади. Усі реквізити нижче є демонстраційними.",
    de: "Spenden helfen, Kurse zugänglicher zu machen, Materialien zu finanzieren und Community-Angebote zu ermöglichen. Alle Angaben sind Demo-Daten.",
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
      id: "bank-demo",
      type: "bank",
      title: { uk: "Банківський переказ", de: "Banküberweisung" },
      description: {
        uk: "Демонстраційна структура реквізитів — реальні дані додаються лише після верифікації Verein.",
        de: "Demo-Struktur der Bankdaten — echte Angaben folgen erst nach Verifizierung des Vereins.",
      },
      details: {
        uk: [
          "IBAN: DE00 0000 0000 0000 0000 00",
          "BIC: DEMODE00XXX",
          "Призначення: Spende Demo",
        ],
        de: [
          "IBAN: DE00 0000 0000 0000 0000 00",
          "BIC: DEMODE00XXX",
          "Verwendungszweck: Spende Demo",
        ],
      },
      isDemo: true,
    },
    {
      id: "paypal-demo",
      type: "paypal",
      title: { uk: "PayPal", de: "PayPal" },
      description: {
        uk: "Кнопка активується після підключення офіційного PayPal-акаунта Verein.",
        de: "Die Schaltfläche wird nach Anbindung des offiziellen Vereinskontos aktiviert.",
      },
      details: {
        uk: ["https://paypal.me/example-verein-demo"],
        de: ["https://paypal.me/example-verein-demo"],
      },
      isDemo: true,
    },
    {
      id: "qr-demo",
      type: "qr",
      title: { uk: "Швидка оплата", de: "Schnell bezahlen" },
      description: {
        uk: "Захищений платіжний QR з'явиться автоматично після підключення перевірених реквізитів.",
        de: "Ein sicherer Zahlungs-QR erscheint automatisch nach Anbindung verifizierter Zahlungsdaten.",
      },
      details: {
        uk: ["QR буде згенеровано після підключення реальних реквізитів."],
        de: ["Der QR-Code wird nach Einbindung echter Zahlungsdaten erstellt."],
      },
      isDemo: true,
    },
  ],
  seo: {
    title: { uk: "Підтримати Verein", de: "Verein unterstützen" },
    description: {
      uk: "Дізнайтеся, як підтримати український Verein у Німеччині. Демонстраційні реквізити.",
      de: "Erfahren Sie, wie Sie den ukrainischen Verein in Deutschland unterstützen können. Demo-Daten.",
    },
  },
};
