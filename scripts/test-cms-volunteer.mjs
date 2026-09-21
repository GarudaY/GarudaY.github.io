import assert from "node:assert/strict";
import test from "node:test";
import { parseCmsVolunteer } from "../src/lib/cms-volunteer.ts";

const task = (id = "events") => ({
  id,
  icon: "calendar",
  title: { uk: "Допомога на подіях", de: "Mithilfe bei Veranstaltungen" },
  description: { uk: "Зустрічати гостей.", de: "Gäste begrüßen." },
  time: { uk: "Кілька годин", de: "Einige Stunden" },
  location: { uk: "Мьонхенгладбах", de: "Mönchengladbach" },
  order: 10,
});
const parse = (items) => parseCmsVolunteer({ schemaVersion: 1, items });

test("bilingual volunteer tasks retain stable application context and order", () => {
  const later = task("media");
  later.order = 20;
  assert.deepEqual(parse([later, task()]).map((item) => item.id), ["events", "media"]);
  assert.equal(parse([task()])[0].title.de, "Mithilfe bei Veranstaltungen");
});

test("withdrawn tasks stay absent and invalid content cannot enter the page", () => {
  assert.deepEqual(parse([]), []);
  assert.throws(() => parse([task(), task()]));
  const incomplete = task();
  incomplete.description.de = "";
  assert.throws(() => parse([incomplete]));
  const invalidIcon = task();
  invalidIcon.icon = "arbitrary";
  assert.throws(() => parse([invalidIcon]));
  const invalidId = task("../private");
  assert.throws(() => parse([invalidId]));
});
