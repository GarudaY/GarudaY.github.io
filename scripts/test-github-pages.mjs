import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  prepareGitHubPagesSegmentFiles,
  verifyPreviewIndexProtection,
} from "./prepare-github-pages.mjs";

test("static segment URLs work for Windows and Linux exports", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "ukr-pages-segments-"));
  try {
    const page = path.join(fixture, "uk", "courses", "example");
    const segment = path.join(page, "__next.$d$locale", "courses", "$d$slug");
    const assets = path.join(fixture, "images", "nested");
    await mkdir(segment, { recursive: true });
    await mkdir(assets, { recursive: true });
    await writeFile(path.join(segment, "__PAGE__.txt"), "page payload");
    await writeFile(path.join(segment, "notes.json"), "{}");
    await writeFile(
      path.join(page, "__next._tree.txt"),
      "existing Linux payload",
    );
    await writeFile(path.join(assets, "ordinary.txt"), "unrelated asset");

    assert.equal(await prepareGitHubPagesSegmentFiles(fixture), 1);
    const expected = path.join(
      page,
      "__next.$d$locale.courses.$d$slug.__PAGE__.txt",
    );
    assert.equal(await readFile(expected, "utf8"), "page payload");
    assert.equal(
      await readFile(path.join(segment, "__PAGE__.txt"), "utf8"),
      "page payload",
    );
    assert.equal(
      await readFile(path.join(page, "__next._tree.txt"), "utf8"),
      "existing Linux payload",
    );
    assert.deepEqual(await readdir(path.join(fixture, "images")), ["nested"]);
    assert.ok(
      !(await readdir(page)).some((name) => name.endsWith("notes.json")),
    );

    // Re-running the preparation must be safe and preserve the same URL.
    await prepareGitHubPagesSegmentFiles(fixture);
    assert.equal(await readFile(expected, "utf8"), "page payload");
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("temporary Pages and staging exports cannot become indexable", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "ukr-pages-robots-"));
  try {
    for (const locale of ["uk", "de"]) {
      await mkdir(path.join(fixture, locale), { recursive: true });
      await writeFile(
        path.join(fixture, locale, "index.html"),
        '<meta name="robots" content="noindex, nofollow"/>',
      );
    }
    await writeFile(
      path.join(fixture, "robots.txt"),
      "User-Agent: *\nDisallow: /\n",
    );

    assert.equal(
      await verifyPreviewIndexProtection(
        fixture,
        "https://garuday.github.io",
      ),
      true,
    );
    assert.equal(
      await verifyPreviewIndexProtection(
        fixture,
        "https://sonnenblume-mg.com",
      ),
      false,
    );

    await writeFile(path.join(fixture, "uk", "index.html"), "<title>UK</title>");
    await assert.rejects(
      verifyPreviewIndexProtection(
        fixture,
        "https://staging.sonnenblume-mg.com",
      ),
      /missing noindex metadata for uk/,
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
