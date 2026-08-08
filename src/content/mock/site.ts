import type {
  DonationSettings,
  FeaturedContent,
  SiteSettings,
} from "@/types/content";

export const siteSettings: SiteSettings = {
  id: "site-settings",
  name: {
    uk: "SONNENBLUME — Interkultureller Verein e.V.",
    de: "SONNENBLUME — Interkultureller Verein e.V.",
  },
  tagline: {
    uk: "Українська культура, освіта та спільнота у Мьонхенгладбаху",
    de: "Ukrainische Kultur, Bildung und Gemeinschaft in Mönchengladbach",
  },
  description: {
    uk: "SONNENBLUME об’єднує українську громаду Мьонхенгладбаха через культурні й освітні програми, творчі заняття, зустрічі та волонтерство.",
    de: "SONNENBLUME verbindet die ukrainische Community in Mönchengladbach durch Kultur- und Bildungsangebote, kreative Kurse, Begegnungen und Ehrenamt.",
  },
  contact: {
    email: "kontakt@sonnenblume-mg.com",
    coursesEmail: "kurse@sonnenblume-mg.com",
    boardEmail: "vorstand@sonnenblume-mg.com",
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
      label: "Facebook",
      href: "https://www.facebook.com/profile.php?id=61590746722340",
      type: "facebook",
    },
  ],
  stats: [
    {
      id: "languages",
      value: "DE · UA",
      label: { uk: "двомовна інформація", de: "zweisprachige Informationen" },
    },
    {
      id: "legal",
      value: "e.V.",
      label: { uk: "зареєстроване об’єднання", de: "eingetragener Verein" },
    },
    {
      id: "location",
      value: "MG",
      label: {
        uk: "поруч у Мьонхенгладбаху",
        de: "vor Ort in Mönchengladbach",
      },
    },
  ],
  seo: {
    title: {
      uk: "SONNENBLUME — українська громада у Мьонхенгладбаху",
      de: "SONNENBLUME — Ukrainische Community in Mönchengladbach",
    },
    description: {
      uk: "Культурні й освітні програми, події та волонтерство для української громади Мьонхенгладбаха.",
      de: "Kultur- und Bildungsangebote, Veranstaltungen und Ehrenamt für die ukrainische Community in Mönchengladbach.",
    },
  },
};

export const featuredContent: FeaturedContent[] = [
  {
    id: "featured-painting",
    type: "course",
    title: {
      uk: "Курс малювання для підлітків",
      de: "Malkurs für Jugendliche",
    },
    summary: {
      uk: "Щосереди для учасників від 10 до 15 років із Даніїлом Бабичем.",
      de: "Mittwochs für Jugendliche von 10 bis 15 Jahren mit Daniil Babych.",
    },
    hrefRoute: "courses",
    slug: "maliuvannia-daniil-babych",
    badge: { uk: "Набір відкрито", de: "Anmeldung offen" },
  },
  {
    id: "featured-choreography",
    type: "course",
    title: {
      uk: "Хореографічна студія MRIYA",
      de: "Choreografie-Studio MRIYA",
    },
    summary: {
      uk: "Танцювальні заняття з Оленою Шуліменко для дітей 3–5 та 5–12 років.",
      de: "Tanzunterricht mit Olena Shulimenko für Kinder von 3–5 und 5–12 Jahren.",
    },
    hrefRoute: "courses",
    slug: "khoreohrafiia-studiia-mriya",
    badge: { uk: "Для дітей", de: "Für Kinder" },
  },
  {
    id: "featured-donation",
    type: "donation",
    title: {
      uk: "Допоможіть зберігати українське коріння",
      de: "Helfen Sie, ukrainische Wurzeln zu bewahren",
    },
    summary: {
      uk: "Пожертви підтримують культурні й освітні програми для дітей та дорослих.",
      de: "Spenden stärken Kultur- und Bildungsangebote für Kinder und Erwachsene.",
    },
    hrefRoute: "donate",
    badge: { uk: "Підтримати", de: "Unterstützen" },
  },
];

export const donationSettings: DonationSettings = {
  title: {
    uk: "Допоможіть зберегти українське коріння",
    de: "Helfen Sie, ukrainische Wurzeln zu bewahren",
  },
  description: {
    uk: "Для українських родин у Німеччині мова, культура й спільні традиції — це живий зв’язок із домом. Ваша пожертва допомагає SONNENBLUME створювати місця, де діти й дорослі навчаються, творять, зустрічаються та залишаються частиною української культури.",
    de: "Für ukrainische Familien in Deutschland sind Sprache, Kultur und gemeinsame Traditionen eine lebendige Verbindung zur Heimat. Ihre Spende hilft SONNENBLUME, Orte zu schaffen, an denen Kinder und Erwachsene lernen, kreativ sind, einander begegnen und mit der ukrainischen Kultur verbunden bleiben.",
  },
  impact: {
    uk: [
      "матеріали для творчих і дитячих занять",
      "приміщення для курсів, репетицій та подій",
      "культурні програми, що передають мову й традиції дітям",
      "зустрічі, які підтримують українські родини та об’єднують громаду",
    ],
    de: [
      "Materialien für Kreativ- und Kinderangebote",
      "Räume für Kurse, Proben und Veranstaltungen",
      "Kulturprogramme, die Sprache und Traditionen an Kinder weitergeben",
      "Begegnungen, die ukrainische Familien unterstützen und Gemeinschaft schaffen",
    ],
  },
  methods: [
    {
      id: "bank-transfer",
      type: "bank",
      title: { uk: "Банківський переказ", de: "Banküberweisung" },
      description: {
        uk: "Прямий переказ на офіційний рахунок SONNENBLUME e.V.",
        de: "Direkte Überweisung auf das offizielle Konto von SONNENBLUME e.V.",
      },
      details: {
        uk: [
          "Отримувач: Sonnenblume e.V.",
          "IBAN: DE83 3105 0000 1004 2098 37",
          "BIC: MGLSDE33XXX",
          "Призначення: Spende",
        ],
        de: [
          "Empfänger: Sonnenblume e.V.",
          "IBAN: DE83 3105 0000 1004 2098 37",
          "BIC: MGLSDE33XXX",
          "Verwendungszweck: Spende",
        ],
      },
      isDemo: false,
    },
    {
      id: "bank-qr",
      type: "qr",
      title: { uk: "Переказ за QR-кодом", de: "Überweisung per QR-Code" },
      description: {
        uk: "Відскануйте код у банківському застосунку — реквізити заповняться автоматично.",
        de: "Scannen Sie den Code in Ihrer Banking-App; die Kontodaten werden automatisch ausgefüllt.",
      },
      details: {
        uk: [
          "Перед підтвердженням перевірте отримувача та суму у своєму банку.",
        ],
        de: [
          "Bitte prüfen Sie Empfänger und Betrag vor der Bestätigung in Ihrer Banking-App.",
        ],
      },
      isDemo: false,
    },
    {
      id: "in-kind-and-time",
      type: "in-kind",
      title: {
        uk: "Час і практична допомога",
        de: "Zeit und praktische Hilfe",
      },
      description: {
        uk: "Допомогти можна також часом, матеріалами, приміщенням або професійним досвідом.",
        de: "Sie können auch mit Zeit, Materialien, Räumen oder fachlicher Erfahrung helfen.",
      },
      details: {
        uk: ["Розкажіть про свою пропозицію через контактну форму."],
        de: ["Beschreiben Sie Ihr Angebot über das Kontaktformular."],
      },
      isDemo: false,
    },
  ],
  seo: {
    title: { uk: "Підтримати SONNENBLUME", de: "SONNENBLUME unterstützen" },
    description: {
      uk: "Підтримайте культурні й освітні програми SONNENBLUME банківським переказом або власним часом.",
      de: "Unterstützen Sie Kultur- und Bildungsangebote von SONNENBLUME per Überweisung oder mit Ihrer Zeit.",
    },
  },
};
