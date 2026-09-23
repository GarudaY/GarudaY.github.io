import assert from "node:assert/strict";

const base = new URL(process.env.SNB_WP_URL ?? "http://127.0.0.1:9400/");
const mode = process.argv[2] ?? "publish";
if (base.hostname !== "127.0.0.1" && base.hostname !== "localhost") {
  throw new Error(
    "QA fixtures are restricted to a local WordPress installation",
  );
}
if (!["publish", "archive"].includes(mode))
  throw new Error("Use publish or archive");

const cookies = new Map();
let nonce = "";
function collect(response) {
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";", 1)[0];
    const separator = pair.indexOf("=");
    cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
  const nextNonce = response.headers.get("X-WP-Nonce");
  if (nextNonce) nonce = nextNonce;
}
const cookieHeader = () =>
  [...cookies].map(([key, value]) => `${key}=${value}`).join("; ");
async function request(path, options = {}) {
  const target = new URL(path, base);
  if (target.origin !== base.origin)
    throw new Error("QA request attempted to leave localhost");
  const response = await fetch(target, {
    ...options,
    headers: {
      Cookie: cookieHeader(),
      ...(nonce ? { "X-WP-Nonce": nonce } : {}),
      ...options.headers,
    },
    redirect: options.redirect ?? "follow",
    signal: AbortSignal.timeout(30_000),
  });
  collect(response);
  return response;
}
async function json(path, options = {}) {
  const response = await request(path, options);
  const result = await response.json().catch(() => ({}));
  assert.ok(
    response.ok,
    `${path}: ${response.status} ${JSON.stringify(result)}`,
  );
  return result;
}

await request("wp-login.php");
const login = await request("wp-login.php", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    log: "admin",
    pwd: "password",
    "wp-submit": "Log In",
    redirect_to: new URL(
      "wp-admin/admin.php?page=sonnenblume-content",
      base,
    ).toString(),
    testcookie: "1",
  }),
  redirect: "manual",
});
assert.equal(
  login.status,
  302,
  `Local WordPress login returned ${login.status}`,
);
const admin = await request("wp-admin/admin.php?page=sonnenblume-content");
const html = await admin.text();
const rawConfig = html.match(/window\.SNB_CONTENT\s*=\s*(\{[^\n]+\});/);
assert.ok(rawConfig, "Authenticated editor configuration is missing");
nonce = JSON.parse(rawConfig[1]).nonce;

const media = await json(
  "wp-json/wp/v2/media?context=edit&media_type=image&per_page=20",
);
assert.ok(
  media.length >= 3,
  "QA needs at least three existing media-library images",
);
const [cover, galleryOne, galleryTwo] = media;
const tr = (uk, de) => ({ uk, de });
const image = (attachment, uk, de, focus) => ({
  imageId: attachment.id,
  imageAlt: tr(uk, de),
  imageFocus: focus,
});

const fixtures = {
  updates: {
    title: tr(
      "QA · Повністю заповнена новина",
      "QA · Vollständig ausgefüllte Nachricht",
    ),
    status: tr("Перевірка CMS", "CMS-Prüfung"),
    text: tr(
      "Тестова новина перевіряє створення, двомовний текст, категорію, піктограму, порядок, фото, публікацію та архівування. Запис створено автоматизованою QA-перевіркою 23.09.2026.",
      "Diese Testnachricht prüft Erstellung, zweisprachige Inhalte, Kategorie, Symbol, Reihenfolge, Bild, Veröffentlichung und Archivierung. Erstellt durch den automatisierten QA-Test am 23.09.2026.",
    ),
    icon: "lightbulb",
    order: 91,
    ...image(
      cover,
      "Учасники спільноти під час сімейного заходу",
      "Teilnehmende der Community bei einer Familienveranstaltung",
      38,
    ),
    isExample: true,
  },
  people: {
    slug: "qa-cms-complete-person",
    name: tr("QA Профіль Редактора", "QA Redaktionsprofil"),
    roleLabel: tr(
      "Член правління, викладач і волонтер",
      "Vorstandsmitglied, Lehrkraft und Ehrenamtliche Person",
    ),
    bio: tr(
      "Повністю заповнений тестовий профіль перевіряє кілька ролей, біографію, мови, порядок, фото та дозвіл на публікацію.",
      "Das vollständig ausgefüllte Testprofil prüft mehrere Rollen, Biografie, Sprachen, Reihenfolge, Foto und Veröffentlichungsfreigabe.",
    ),
    teacherRoleLabel: tr(
      "Викладач цифрової грамотності",
      "Lehrkraft für digitale Kompetenz",
    ),
    teacherBio: tr(
      "Проводить практичні заняття для дорослих і допомагає учасникам упевнено користуватися цифровими сервісами.",
      "Leitet praktische Kurse für Erwachsene und unterstützt Teilnehmende beim sicheren Umgang mit digitalen Diensten.",
    ),
    roles: ["board", "team", "teacher", "volunteer"],
    boardPosition: "member",
    languages: ["uk", "de", "en"],
    order: 92,
    ...image(
      galleryOne,
      "Портрет тестового профілю редактора",
      "Porträt des QA-Redaktionsprofils",
      44,
    ),
    publicationPermission: true,
  },
  courses: {
    slug: "qa-cms-complete-course",
    title: tr(
      "QA · Практична цифрова майстерня",
      "QA · Praktische Digitalwerkstatt",
    ),
    summary: tr(
      "Тестовий курс із повністю заповненою карткою.",
      "Testkurs mit vollständig ausgefüllter Karte.",
    ),
    description: tr(
      "Практичний курс перевіряє двомовний повний опис, програму, матеріали, розклад, викладача, місця та рекомендацію.",
      "Der Praxiskurs prüft zweisprachige Langbeschreibung, Lernziele, Materialien, Zeitplan, Lehrkraft, Plätze und Empfehlung.",
    ),
    outcomes: {
      uk: [
        "Безпечно користуватися онлайн-сервісами",
        "Створювати та впорядковувати документи",
      ],
      de: [
        "Online-Dienste sicher nutzen",
        "Dokumente erstellen und organisieren",
      ],
    },
    materials: {
      uk: ["Власний смартфон або ноутбук", "Блокнот для нотаток"],
      de: ["Eigenes Smartphone oder Laptop", "Notizbuch"],
    },
    ageGroup: tr("Дорослі 18+", "Erwachsene 18+"),
    language: tr("Українська та німецька", "Ukrainisch und Deutsch"),
    format: tr("Очний практикум", "Präsenz-Workshop"),
    location: tr(
      "Офіс SONNENBLUME, Mönchengladbach",
      "SONNENBLUME-Büro, Mönchengladbach",
    ),
    price: tr("Безкоштовно за реєстрацією", "Kostenlos mit Anmeldung"),
    startsAt: "2026-10-10",
    duration: tr("6 зустрічей по 90 хвилин", "6 Termine à 90 Minuten"),
    seatsTotal: 24,
    seatsAvailable: 24,
    teacherIds: ["person-qa-cms-complete-person"],
    relatedCourseIds: [],
    schedule: [
      {
        weekday: tr("Щосуботи", "Jeden Samstag"),
        time: "11:00–12:30",
        cadence: tr("Щотижня", "Wöchentlich"),
      },
    ],
    category: "integration",
    enrollmentStatus: "open",
    isFeatured: true,
    order: 93,
    ...image(
      galleryTwo,
      "Учасники практичної цифрової майстерні",
      "Teilnehmende der praktischen Digitalwerkstatt",
      52,
    ),
  },
  events: {
    slug: "qa-cms-complete-event",
    title: tr(
      "QA · День цифрової взаємодопомоги",
      "QA · Tag der digitalen Nachbarschaftshilfe",
    ),
    summary: tr(
      "Тестова подія з реєстрацією, галереєю та повними даними.",
      "Testveranstaltung mit Anmeldung, Galerie und vollständigen Angaben.",
    ),
    description: tr(
      "Подія перевіряє календар, часовий інтервал, організатора, контакт, пов’язаний курс, рекомендований статус, місткість і лист очікування.",
      "Die Veranstaltung prüft Kalender, Zeitraum, Veranstalter, Kontakt, verknüpften Kurs, Empfehlung, Kapazität und Warteliste.",
    ),
    dateLabel: tr("5 грудня 2026 року", "5. Dezember 2026"),
    timeLabel: tr("14:00–18:00", "14:00–18:00 Uhr"),
    location: tr(
      "Офіс SONNENBLUME, Mönchengladbach",
      "SONNENBLUME-Büro, Mönchengladbach",
    ),
    price: tr("Вхід вільний за реєстрацією", "Eintritt frei mit Anmeldung"),
    registrationLabel: tr("Зареєструватися", "Jetzt anmelden"),
    category: "integration",
    eventStatus: "upcoming",
    archiveType: "announcement",
    organizerName: "SONNENBLUME Ukraine Community MG e.V.",
    startsAt: "2026-12-05T14:00:00+01:00",
    endsAt: "2026-12-05T18:00:00+01:00",
    contactEmail: "kontakt@sonnenblume-mg.com",
    relatedCourseIds: ["course-qa-cms-complete-course"],
    gallery: [
      image(
        galleryOne,
        "Практична робота учасників події",
        "Praktische Arbeit der Veranstaltungsteilnehmenden",
        46,
      ),
      image(
        galleryTwo,
        "Спільне обговорення під час події",
        "Gemeinsames Gespräch während der Veranstaltung",
        57,
      ),
    ],
    isFeatured: true,
    capacity: 18,
    seatsAvailable: 18,
    order: 94,
    ...image(
      cover,
      "Обкладинка дня цифрової взаємодопомоги",
      "Titelbild des Tags der digitalen Nachbarschaftshilfe",
      42,
    ),
  },
  volunteer: {
    slug: "qa-cms-complete-volunteer",
    title: tr(
      "QA · Помічник цифрової майстерні",
      "QA · Assistenz der Digitalwerkstatt",
    ),
    description: tr(
      "Допомагати учасникам під час практичних вправ, готувати робочі місця та збирати запитання для викладача.",
      "Teilnehmende bei Übungen unterstützen, Arbeitsplätze vorbereiten und Fragen für die Lehrkraft sammeln.",
    ),
    time: tr(
      "2 години щосуботи протягом 6 тижнів",
      "2 Stunden samstags für 6 Wochen",
    ),
    location: tr("Mönchengladbach · очно", "Mönchengladbach · vor Ort"),
    icon: "heart",
    order: 95,
  },
  partners: {
    slug: "qa-cms-complete-partner",
    kind: "organization",
    name: "QA Partnerorganisation",
    description: tr(
      "Дякуємо за тестову підтримку цифрової майстерні, приміщення, техніку та волонтерську координацію.",
      "Danke für die testweise Unterstützung der Digitalwerkstatt mit Räumen, Technik und Ehrenamtskoordination.",
    ),
    website: "https://example.org/qa-sonnenblume",
    publicationPermission: true,
    order: 96,
    ...image(
      galleryOne,
      "Логотип тестової партнерської організації",
      "Logo der QA-Partnerorganisation",
      50,
    ),
  },
};

const order = [
  "updates",
  "people",
  "courses",
  "events",
  "volunteer",
  "partners",
];
const archiveOrder = [
  "events",
  "courses",
  "people",
  "partners",
  "volunteer",
  "updates",
];
const matches = {
  updates: (item) => item.data?.title?.uk === fixtures.updates.title.uk,
  people: (item) => item.data?.slug === fixtures.people.slug,
  courses: (item) => item.data?.slug === fixtures.courses.slug,
  events: (item) => item.data?.slug === fixtures.events.slug,
  volunteer: (item) => item.data?.slug === fixtures.volunteer.slug,
  partners: (item) => item.data?.slug === fixtures.partners.slug,
};
const publicMatches = {
  updates: (item) => item.title?.uk === fixtures.updates.title.uk,
  people: (item) => item.slug === fixtures.people.slug,
  courses: (item) => item.slug === fixtures.courses.slug,
  events: (item) => item.slug === fixtures.events.slug,
  volunteer: (item) => item.id === fixtures.volunteer.slug,
  partners: (item) => item.id === fixtures.partners.slug,
};

async function write(name, action) {
  const list = await json(`wp-json/sonnenblume/v1/${name}`);
  const current = list.items.find(matches[name]);
  if (action === "archive" && (!current || current.archived)) {
    process.stdout.write(`${name}: already archived\n`);
    return;
  }
  const endpoint = `wp-json/sonnenblume/v1/${name}${current ? `/${current.id}` : ""}`;
  const result = await json(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      ...(current ? { revision: current.revision } : {}),
      data: fixtures[name],
    }),
  });
  process.stdout.write(
    `${name}: ${action} id=${result.id} revision=${result.revision}\n`,
  );
}

for (const name of mode === "publish" ? order : archiveOrder)
  await write(name, mode);

const state = {};
for (const name of order) {
  const list = await json(`wp-json/sonnenblume/v1/${name}`);
  const item = list.items.find(matches[name]);
  const publicList = await json(`wp-json/sonnenblume/v1/${name}/public`);
  const publicVisible = publicList.items.some(publicMatches[name]);
  assert.equal(
    publicVisible,
    mode === "publish",
    `${name}: unexpected public visibility`,
  );
  state[name] = item
    ? {
        id: item.id,
        archived: item.archived,
        revision: item.revision,
        publicVisible,
      }
    : null;
}
process.stdout.write(`${JSON.stringify({ ok: true, mode, state })}\n`);
