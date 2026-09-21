import assert from "node:assert/strict";
import test from "node:test";
import { parseCmsPartners } from "../src/lib/cms-partners.ts";

const cms = new URL("https://cms.example.org/?rest_route=/sonnenblume/v1/partners/public");
const record = (id = "verein") => ({
  id, kind: "organization", name: "Verein", description: { uk: "Допомога", de: "Unterstützung" },
  website: "https://example.org/", order: 10,
  image: { url: "https://cms.example.org/wp-content/uploads/logo.png", alt: { uk: "Логотип", de: "Logo" }, focus: 50 },
});
const parse = (items, initialized = true) => parseCmsPartners({ schemaVersion: 1, initialized, items }, cms);

test("organizations retain media, translated thanks and order", () => {
  const later = record("later"); later.order = 20;
  assert.deepEqual(parse([later, record()]).items.map((item) => item.id), ["verein", "later"]);
  assert.equal(parse([record()]).items[0].logo.src, record().image.url);
});

test("individual helper may omit photo, but unpublished identities are not invented", () => {
  const person = { ...record("helper"), kind: "person", image: null, website: "" };
  assert.equal(parse([person]).items[0].logo, undefined);
  assert.deepEqual(parse([], false).items, []);
  assert.deepEqual(parse([]).items, []);
  assert.equal(parse([person], false).initialized, false);
});

test("invalid IDs, media origin, duplicate identities and unsafe links are rejected", () => {
  assert.throws(() => parse([record(), record()]));
  assert.throws(() => parse([record("../private")]));
  assert.throws(() => parse([{ ...record(), image: null }]));
  assert.throws(() => parse([{ ...record(), image: { ...record().image, url: "https://other.example.org/wp-content/uploads/logo.png" } }]));
  assert.throws(() => parse([{ ...record(), website: "javascript:alert(1)" }]));
  assert.throws(() => parse([{ ...record(), description: { uk: "", de: "Danke" } }]));
});
