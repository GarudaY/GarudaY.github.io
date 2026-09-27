import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  mergeHtaccess,
  writeMergedHtaccess,
} from "./merge-production-htaccess.mjs";

const generated = [
  "# BEGIN SONNENBLUME legacy redirects",
  "RewriteEngine On",
  "RewriteRule ^old/?$ /de/ [R=301,L]",
  "# END SONNENBLUME legacy redirects",
  "",
].join("\n");

const wordpress = [
  "# BEGIN WordPress",
  "<IfModule mod_rewrite.c>",
  "RewriteRule . /index.php [L]",
  "</IfModule>",
  "# END WordPress",
].join("\r\n");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("htaccess merge inserts redirects before WordPress and preserves CRLF", () => {
  const current = `Options -Indexes\r\n${wordpress}\r\n# custom tail\r\n`;
  const merged = mergeHtaccess(current, generated);
  assert.ok(
    merged.indexOf("# BEGIN SONNENBLUME") < merged.indexOf("# BEGIN WordPress"),
  );
  assert.ok(merged.includes("# custom tail\r\n"));
  assert.equal(merged.replaceAll("\r\n", "").includes("\n"), false);
  assert.ok(merged.includes(wordpress));
  assert.ok(merged.endsWith("\r\n"));
});

test("htaccess merge replaces a stale block and is idempotent", () => {
  const stale = generated.replace(
    "RewriteRule ^old/?$ /de/ [R=301,L]",
    "RewriteRule ^stale/?$ /uk/ [R=302,L]",
  );
  const current = `${stale}\n# custom\n${wordpress.replaceAll("\r\n", "\n")}\n`;
  const merged = mergeHtaccess(current, generated);
  assert.doesNotMatch(merged, /stale/);
  assert.match(merged, /RewriteRule \^old/);
  assert.equal(mergeHtaccess(merged, generated), merged);
});

test("htaccess merge accepts the complete production redirect block", async () => {
  const productionRules = await readFile(
    path.join(root, "artifacts", "legacy-redirects.htaccess"),
    "utf8",
  );
  const current = `Options -Indexes\r\n${wordpress}\r\n`;
  const merged = mergeHtaccess(current, productionRules);
  assert.equal((merged.match(/^RewriteRule /gm) || []).length, 46);
  assert.ok(merged.includes(wordpress));
  assert.equal(mergeHtaccess(merged, productionRules), merged);
});

test("htaccess merge refuses missing, duplicate and misordered markers", () => {
  assert.throws(
    () => mergeHtaccess("Options -Indexes\n", generated),
    /exactly one complete WordPress block/,
  );
  assert.throws(
    () => mergeHtaccess(`${wordpress}\r\n${wordpress}`, generated),
    /exactly one complete WordPress block/,
  );
  assert.throws(
    () =>
      mergeHtaccess(
        `${wordpress.replaceAll("\r\n", "\n")}\n${generated}`,
        generated,
      ),
    /must be before the WordPress block/,
  );
  assert.throws(
    () => mergeHtaccess(wordpress, generated.replace("# END", " # END")),
    /Malformed marker line/,
  );
  assert.throws(
    () => mergeHtaccess(wordpress, `${generated}\nHeader set X-Test true`),
    /must contain only its marked block/,
  );
});

test("htaccess preview writer never overwrites inputs or an existing output", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "ukr-htaccess-"));
  try {
    const currentPath = path.join(fixture, "current.htaccess");
    const rulesPath = path.join(fixture, "rules.htaccess");
    const outputPath = path.join(fixture, "merged.htaccess");
    await writeFile(currentPath, wordpress);
    await writeFile(rulesPath, generated);
    await writeMergedHtaccess({ currentPath, rulesPath, outputPath });
    assert.match(await readFile(outputPath, "utf8"), /BEGIN SONNENBLUME/);
    await assert.rejects(
      writeMergedHtaccess({ currentPath, rulesPath, outputPath }),
      /EEXIST/,
    );
    await assert.rejects(
      writeMergedHtaccess({
        currentPath,
        rulesPath,
        outputPath: currentPath,
      }),
      /never overwritten/,
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
