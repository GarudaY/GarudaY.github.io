import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  parseVereinUpdates,
  wordpressNewsEndpoint,
} from "../src/lib/verein-updates.ts";

const items = JSON.parse(
  await readFile(
    new URL("../src/content/mock/verein-updates.json", import.meta.url),
    "utf8",
  ),
);
const base = new URL("https://cms.example.org/");
test("CMS schema accepts the existing bilingual examples", () =>
  assert.equal(
    parseVereinUpdates({ schemaVersion: 1, items }, base).length,
    3,
  ));
test("empty published collection remains empty", () =>
  assert.deepEqual(
    parseVereinUpdates({ schemaVersion: 1, items: [] }, base),
    [],
  ));
test("unsupported schema and incomplete translations are rejected", () => {
  assert.throws(() => parseVereinUpdates({ schemaVersion: 2, items }, base));
  const broken = structuredClone(items);
  broken[0].title.de = "";
  assert.throws(() =>
    parseVereinUpdates({ schemaVersion: 1, items: broken }, base),
  );
});
test("arbitrary media hosts, dangerous URLs and duplicate IDs are rejected", () => {
  const broken = structuredClone(items);
  broken[0].image = {
    url: "https://evil.example/track.jpg",
    alt: { uk: "Фото", de: "Foto" },
    focus: 50,
  };
  assert.throws(() =>
    parseVereinUpdates({ schemaVersion: 1, items: broken }, base),
  );
  broken[0].image.url = "javascript:alert(1)";
  assert.throws(() =>
    parseVereinUpdates({ schemaVersion: 1, items: broken }, base),
  );
  assert.throws(() =>
    parseVereinUpdates({ schemaVersion: 1, items: [items[0], items[0]] }, base),
  );
});
test("own WordPress media, order and publication timestamp are accepted", () => {
  const feed = structuredClone(items);
  feed[0].image = {
    url: "https://cms.example.org/wp-content/uploads/2026/09/photo.jpg",
    alt: { uk: "Фото", de: "Foto" },
    focus: 20,
  };
  feed[0].publishedAt = "2026-09-14T00:00:00+00:00";
  feed.reverse();
  assert.equal(
    parseVereinUpdates({ schemaVersion: 1, items: feed }, base)[0].id,
    items[0].id,
  );
});
test("endpoint supports subdirectory WordPress, but rejects insecure production configuration", () => {
  assert.equal(
    wordpressNewsEndpoint("https://example.org/editor/").searchParams.get(
      "rest_route",
    ),
    "/sonnenblume/v1/updates/public",
  );
  assert.equal(
    wordpressNewsEndpoint("https://example.org/editor/").pathname,
    "/editor/",
  );
  assert.throws(() => wordpressNewsEndpoint("http://example.org"));
  assert.throws(() =>
    wordpressNewsEndpoint("https://admin:secret@example.org"),
  );
  assert.throws(() => wordpressNewsEndpoint("http://127.0.0.1:9400"));
  assert.equal(
    wordpressNewsEndpoint("http://127.0.0.1:9400", true).port,
    "9400",
  );
});
