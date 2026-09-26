import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  renderApacheLegacyRedirects,
  validateLegacyRedirectConfiguration,
} from "./legacy-redirects.mjs";
import { prepareProductionUpload } from "./prepare-production-upload.mjs";

async function createExportFixture(parent) {
  const source = path.join(parent, "export");
  const legacy = await validateLegacyRedirectConfiguration();
  await mkdir(path.join(source, "de"), { recursive: true });
  await mkdir(path.join(source, "_next"), { recursive: true });
  await mkdir(path.join(source, ".github"), { recursive: true });
  await writeFile(
    path.join(source, "robots.txt"),
    "User-Agent: *\nAllow: /\n\nSitemap: https://sonnenblume-mg.com/sitemap.xml\n",
  );
  await writeFile(
    path.join(source, "sitemap.xml"),
    "<urlset><url><loc>https://sonnenblume-mg.com/de/</loc></url></urlset>",
  );
  await writeFile(
    path.join(source, "de", "index.html"),
    '<link rel="canonical" href="https://sonnenblume-mg.com/de/">',
  );
  await writeFile(
    path.join(source, "_next", "client.js"),
    '"/wp-json/sonnenblume/v1/contact";"/wp-json/sonnenblume/v1/registrations";',
  );
  await writeFile(
    path.join(source, "legacy-redirects.htaccess"),
    renderApacheLegacyRedirects(legacy.redirects),
  );
  await writeFile(path.join(source, ".nojekyll"), "");
  await writeFile(path.join(source, ".github", "workflow.yml"), "preview only");
  return source;
}

test("production package separates webroot from server configuration", async () => {
  const fixture = await mkdtemp(
    path.join(os.tmpdir(), "ukr-production-package-"),
  );
  try {
    const source = await createExportFixture(fixture);
    const destination = path.join(fixture, "package");
    const result = await prepareProductionUpload({ source, destination });
    assert.equal(result.files, 4);
    await access(path.join(destination, "webroot", "de", "index.html"));
    await access(
      path.join(destination, "server-config", "legacy-redirects.htaccess"),
    );
    await assert.rejects(access(path.join(destination, "webroot", ".github")));
    await assert.rejects(
      access(path.join(destination, "webroot", ".nojekyll")),
    );
    await assert.rejects(
      access(path.join(destination, "webroot", "legacy-redirects.htaccess")),
    );
    const manifest = JSON.parse(
      await readFile(
        path.join(destination, "production-upload-manifest.json"),
        "utf8",
      ),
    );
    assert.equal(manifest.webroot.files, 4);
    assert.ok(
      manifest.webroot.entries.every((entry) =>
        /^[a-f0-9]{64}$/.test(entry.sha256),
      ),
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("production package refuses WordPress path collisions", async () => {
  const fixture = await mkdtemp(
    path.join(os.tmpdir(), "ukr-production-collision-"),
  );
  try {
    const source = await createExportFixture(fixture);
    await mkdir(path.join(source, "wp-admin"));
    await assert.rejects(
      prepareProductionUpload({
        source,
        destination: path.join(fixture, "package"),
      }),
      /collides with protected WordPress path: wp-admin/,
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
