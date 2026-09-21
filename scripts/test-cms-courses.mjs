import assert from "node:assert/strict";
import test from "node:test";
import { parseCmsCourses } from "../src/lib/cms-courses.ts";

const url = new URL("https://cms.example.org/");
const course = (slug = "fixture") => ({
  id: `course-${slug}`,
  slug,
  enrollmentStatus: "open",
  category: "language",
  title: { uk: "Тестовий курс", de: "Testkurs" },
  summary: { uk: "Короткий опис", de: "Kurzbeschreibung" },
  description: { uk: "Повний опис", de: "Vollständige Beschreibung" },
  outcomes: { uk: ["Результат"], de: ["Ergebnis"] },
  materials: { uk: [], de: [] },
  ageGroup: { uk: "дорослі", de: "Erwachsene" },
  language: { uk: "українська", de: "Ukrainisch" },
  format: { uk: "очно", de: "vor Ort" },
  location: { uk: "Mönchengladbach", de: "Mönchengladbach" },
  schedule: [],
  price: { uk: "безкоштовно", de: "kostenfrei" },
  startsAt: "",
  duration: { uk: "регулярно", de: "regelmäßig" },
  seatsTotal: 0,
  seatsAvailable: 0,
  teacherIds: [],
  relatedCourseIds: [],
  image: {
    url: "https://cms.example.org/wp-content/uploads/course.webp",
    alt: { uk: "Заняття", de: "Unterricht" },
    focus: 50,
  },
  isFeatured: false,
  order: 10,
  createdAt: "2026-09-15T12:00:00+00:00",
  updatedAt: "2026-09-15T12:00:00+00:00",
});

const parse = (items) => parseCmsCourses({ schemaVersion: 1, items }, url);

test("published bilingual course maps to the existing site contract", () => {
  const [result] = parse([course()]);
  assert.equal(result.status, "published");
  assert.equal(result.image.src, course().image.url);
  assert.equal(result.seo.title.de, "Testkurs");
});

test("identity, relationships and seat counts stay coherent", () => {
  const first = course();
  first.id = "unsafe";
  assert.throws(() => parse([first]));
  assert.throws(() => parse([course(), course()]));
  const invalidSeats = course();
  invalidSeats.seatsAvailable = 1;
  assert.throws(() => parse([invalidSeats]));
  const linked = course();
  linked.relatedCourseIds = ["course-related"];
  assert.throws(() => parse([linked]));
  assert.equal(parse([linked, course("related")]).length, 2);
  const legacy = course("kurs-nimetskoi-movy");
  legacy.id = "course-german";
  assert.equal(parse([legacy])[0].slug, "kurs-nimetskoi-movy");
});

test("course media must come from the configured WordPress uploads", () => {
  const record = course();
  for (const src of [
    "https://evil.example/wp-content/uploads/course.webp",
    "https://cms.example.org/private/course.webp",
    "https://cms.example.org/wp-content/uploads/course.webp?secret=1",
  ]) {
    record.image.url = src;
    assert.throws(() => parse([record]));
  }
});
