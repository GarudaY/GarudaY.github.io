import assert from "node:assert/strict";
import test from "node:test";
import { parseCmsPeople } from "../src/lib/cms-people.ts";

const url = new URL("https://cms.example.org/");
const profile = () => ({
  id: "person-fixture",
  slug: "fixture",
  name: { uk: "Тестовий профіль", de: "Testprofil" },
  roleLabel: { uk: "Волонтер", de: "Ehrenamt" },
  bio: { uk: "Перевірений опис", de: "Bestätigte Beschreibung" },
  teacherRoleLabel: { uk: "", de: "" },
  teacherBio: { uk: "", de: "" },
  roles: ["volunteer"],
  boardPosition: null,
  languages: [],
  relatedCourseIds: [],
  order: 10,
  createdAt: "2026-09-15T12:00:00+00:00",
  updatedAt: "2026-09-15T12:00:00+00:00",
  image: null,
});
const parse = (items) => parseCmsPeople({ schemaVersion: 1, items }, url);
test("published volunteer profile maps to existing site type without membership requirement", () => {
  const [person] = parse([profile()]);
  assert.equal(person.status, "published");
  assert.equal(person.id, "person-fixture");
  assert.equal(person.teacherBio, undefined);
  assert.equal(person.isDemo, false);
});
test("withdrawn profiles are not restored when the collection is empty", () =>
  assert.deepEqual(parse([]), []));
test("identity, duplicate profiles, board roles and unique chair are validated", () => {
  const first = profile();
  first.id = "person-other";
  assert.throws(() => parse([first]));
  assert.throws(() => parse([profile(), profile()]));
  const chair = profile();
  chair.boardPosition = "chair";
  assert.throws(() => parse([chair]));
  chair.roles = ["board"];
  const second = { ...chair, id: "person-second", slug: "second" };
  assert.throws(() => parse([chair, second]));
  assert.equal(parse([chair])[0].boardPosition, "chair");
});
test("teacher roles require distinct bilingual teacher descriptions", () => {
  const teacher = profile();
  teacher.roles = ["teacher"];
  assert.throws(() => parse([teacher]));
  teacher.teacherRoleLabel = { uk: "Німецька мова", de: "Deutsch" };
  teacher.teacherBio = { uk: "Опис курсу", de: "Kursbeschreibung" };
  teacher.relatedCourseIds = ["course-german"];
  assert.equal(parse([teacher])[0].teacherRoleLabel.de, "Deutsch");
  teacher.teacherBio.de = "";
  assert.throws(() => parse([teacher]));
});
test("own media with bilingual alt and focus is accepted; foreign or credential URLs rejected", () => {
  const person = profile();
  person.image = {
    url: "https://cms.example.org/wp-content/uploads/portrait.webp",
    alt: { uk: "Портрет", de: "Porträt" },
    focus: 28,
  };
  assert.equal(parse([person])[0].image.focus, 28);
  for (const src of [
    "https://evil.example/wp-content/uploads/x.png",
    "https://user:password@cms.example.org/wp-content/uploads/x.png",
    "https://cms.example.org/private/x.png",
    "https://cms.example.org/wp-content/uploads/x.png?key=secret",
  ]) {
    person.image.url = src;
    assert.throws(() => parse([person]));
  }
});
