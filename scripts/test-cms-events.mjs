import assert from "node:assert/strict";
import test from "node:test";
import { parseCmsEvents } from "../src/lib/cms-events.ts";

const cms = new URL("https://cms.example.org/");
const event = (slug = "fixture") => ({
  id: `event-${slug}`,
  slug,
  eventStatus: "upcoming",
  category: "community",
  title: { uk: "Подія", de: "Veranstaltung" },
  summary: { uk: "Короткий опис", de: "Kurzbeschreibung" },
  description: { uk: "Повний опис", de: "Vollständige Beschreibung" },
  startsAt: "2026-10-18T15:00:00+02:00",
  endsAt: "2026-10-18T17:00:00+02:00",
  location: { uk: "Mönchengladbach", de: "Mönchengladbach" },
  price: { uk: "Безкоштовно", de: "Kostenfrei" },
  registrationLabel: { uk: "Дізнатися більше", de: "Mehr erfahren" },
  capacity: 0,
  seatsAvailable: 0,
  contactEmail: "kontakt@sonnenblume-mg.com",
  image: {
    url: "https://cms.example.org/wp-content/uploads/event.webp",
    alt: { uk: "Учасники події", de: "Teilnehmende" },
    focus: 50,
  },
  gallery: [],
  relatedArticleIds: [],
  relatedCourseIds: [],
  isFeatured: true,
  order: 10,
  createdAt: "2026-09-15T12:00:00+00:00",
  updatedAt: "2026-09-15T12:00:00+00:00",
});
const parse = (items) => parseCmsEvents({ schemaVersion: 1, items }, cms);

test("bilingual event maps to the public site contract", () => {
  const [result] = parse([event()]);
  assert.equal(result.status, "published");
  assert.equal(result.image.src, event().image.url);
  assert.equal(result.seo.title.de, "Veranstaltung");
  assert.equal("order" in result, false);
});

test("event identity, dates and registration-owned capacity stay safe", () => {
  const duplicate = event();
  assert.throws(() => parse([duplicate, duplicate]));
  const reversed = event();
  reversed.endsAt = "2026-10-18T14:00:00+02:00";
  assert.throws(() => parse([reversed]));
  const forgedCapacity = event();
  forgedCapacity.capacity = 50;
  assert.throws(() => parse([forgedCapacity]));
  const legacy = event("muzychna-zustrich-2025");
  legacy.id = "event-music-meeting-2025";
  assert.equal(parse([legacy])[0].id, "event-music-meeting-2025");
});

test("event covers and every gallery image must use the CMS media library", () => {
  const value = event();
  value.gallery = [
    {
      url: "https://cms.example.org/wp-content/uploads/gallery.jpg",
      alt: { uk: "Фото", de: "Foto" },
      focus: 40,
    },
  ];
  assert.equal(parse([value])[0].gallery.length, 1);
  value.gallery[0].url = "https://evil.example/wp-content/uploads/gallery.jpg";
  assert.throws(() => parse([value]));
  value.gallery[0].url =
    "https://cms.example.org/wp-content/uploads/gallery.jpg?token=secret";
  assert.throws(() => parse([value]));
});
