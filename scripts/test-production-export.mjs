import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  renderApacheLegacyRedirects,
  validateLegacyRedirectConfiguration,
} from "./legacy-redirects.mjs";
import { verifyProductionExport } from "./verify-production-export.mjs";

async function createFixture() {
  const fixture = await mkdtemp(
    path.join(os.tmpdir(), "ukr-production-export-"),
  );
  const legacy = await validateLegacyRedirectConfiguration();
  await mkdir(path.join(fixture, "de"), { recursive: true });
  await mkdir(path.join(fixture, "_next"), { recursive: true });
  await writeFile(
    path.join(fixture, "robots.txt"),
    "User-Agent: *\nAllow: /\n\nSitemap: https://sonnenblume-mg.com/sitemap.xml\n",
  );
  await writeFile(
    path.join(fixture, "sitemap.xml"),
    "<urlset><url><loc>https://sonnenblume-mg.com/de/</loc></url></urlset>",
  );
  await writeFile(
    path.join(fixture, "de", "index.html"),
    '<link rel="canonical" href="https://sonnenblume-mg.com/de/">',
  );
  await writeFile(
    path.join(fixture, "_next", "client.js"),
    '"/wp-json/sonnenblume/v1/contact";"/wp-json/sonnenblume/v1/registrations";',
  );
  await writeFile(
    path.join(fixture, "legacy-redirects.htaccess"),
    renderApacheLegacyRedirects(legacy.redirects),
  );
  return fixture;
}

test("production export has one origin, indexable metadata and WordPress forms", async () => {
  const fixture = await createFixture();
  try {
    const result = await verifyProductionExport(
      fixture,
      "https://sonnenblume-mg.com",
      "wordpress",
    );
    assert.equal(result.sitemapUrls, 1);
    assert.equal(result.legacyRedirects, 45);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("production verification rejects preview origins and the wrong API mode", async () => {
  const fixture = await createFixture();
  try {
    await writeFile(
      path.join(fixture, "_next", "leak.js"),
      'const old="https://garuday.github.io";',
    );
    await assert.rejects(
      verifyProductionExport(
        fixture,
        "https://sonnenblume-mg.com",
        "wordpress",
      ),
      /contains forbidden origin/,
    );
    await assert.rejects(
      verifyProductionExport(fixture, "https://sonnenblume-mg.com", "next"),
      /must use the WordPress API mode/,
    );
    assert.equal(
      await verifyProductionExport(
        fixture,
        "https://garuday.github.io",
        "next",
      ),
      false,
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
