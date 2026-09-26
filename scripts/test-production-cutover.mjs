import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import {
  inspectBackup,
  runPreflight,
  verifyProductionPackage,
} from "./verify-production-cutover.mjs";

const gzipAsync = promisify(gzip);
const now = Date.parse("2026-09-26T12:00:00.000Z");

async function createPackage(
  parent,
  generatedAt = new Date(now).toISOString(),
) {
  const directory = path.join(parent, "package");
  const webroot = path.join(directory, "webroot");
  const serverConfig = path.join(directory, "server-config");
  await mkdir(webroot, { recursive: true });
  await mkdir(serverConfig, { recursive: true });
  const html = Buffer.from("<h1>Production</h1>");
  const rules = Buffer.from("RewriteRule ^old/$ /de/ [R=301,L]");
  await writeFile(path.join(webroot, "index.html"), html);
  await writeFile(path.join(serverConfig, "legacy-redirects.htaccess"), rules);
  const entry = (filePath, content) => ({
    path: filePath,
    bytes: content.length,
    sha256: createHash("sha256").update(content).digest("hex"),
  });
  await writeFile(
    path.join(directory, "production-upload-manifest.json"),
    JSON.stringify({
      schema: 1,
      siteUrl: "https://sonnenblume-mg.com",
      generatedAt,
      webroot: {
        files: 1,
        bytes: html.length,
        entries: [entry("index.html", html)],
      },
      serverConfig: [entry("legacy-redirects.htaccess", rules)],
    }),
  );
  return directory;
}

async function createBackup(parent, capturedAt = now) {
  const directory = path.join(parent, "SONNENBLUME-private-backup-test");
  const wordpress = path.join(directory, "wordpress-files", "wp-content");
  await mkdir(wordpress, { recursive: true });
  const content = Buffer.from("<?php echo 'backup';");
  await writeFile(path.join(wordpress, "index.php"), content);
  await writeFile(path.join(directory, "wp-config.php"), "<?php");
  const manifestPath = path.join(directory, "wordpress-files-manifest.json");
  await writeFile(
    manifestPath,
    JSON.stringify({
      host: "example.test",
      files: [
        {
          path: "wp-content/index.php",
          size: content.length,
          sha256: createHash("sha256").update(content).digest("hex"),
        },
      ],
      total_bytes: content.length,
    }),
  );
  const databasePath = path.join(directory, "database-2026-09-26.sql.gz");
  await writeFile(
    databasePath,
    await gzipAsync("CREATE TABLE `wp_options` (`option_id` bigint);"),
  );
  const time = new Date(capturedAt);
  const { utimes } = await import("node:fs/promises");
  await utimes(manifestPath, time, time);
  await utimes(databasePath, time, time);
  return directory;
}

test("production package verification catches tampering", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "ukr-cutover-package-"));
  try {
    const packageDirectory = await createPackage(fixture);
    const verified = await verifyProductionPackage(packageDirectory, { now });
    assert.equal(verified.files, 1);
    assert.equal(verified.fresh, true);
    await writeFile(
      path.join(packageDirectory, "webroot", "index.html"),
      "tampered",
    );
    await assert.rejects(
      verifyProductionPackage(packageDirectory, { now }),
      /checksum mismatch/,
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("backup inspection validates the database and rejects stale captures", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "ukr-cutover-backup-"));
  try {
    const backupDirectory = await createBackup(fixture, now - 25 * 3_600_000);
    const backup = await inspectBackup(backupDirectory, {
      now,
      maxAgeHours: 24,
    });
    assert.equal(backup.files, 1);
    assert.equal(backup.fresh, false);
    assert.ok(backup.ageHours >= 25);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("backup inspection rejects an incomplete file tree", async () => {
  const fixture = await mkdtemp(
    path.join(os.tmpdir(), "ukr-cutover-incomplete-"),
  );
  try {
    const backupDirectory = await createBackup(fixture);
    await writeFile(
      path.join(backupDirectory, "wordpress-files", "wp-content", "index.php"),
      "short",
    );
    await assert.rejects(
      inspectBackup(backupDirectory, { now }),
      /Backup file size mismatch/,
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("offline preflight is ready only with fresh package and backup", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "ukr-cutover-report-"));
  try {
    const packageDirectory = await createPackage(fixture);
    const backupDirectory = await createBackup(fixture, now - 2 * 3_600_000);
    const ready = await runPreflight({
      packageDirectory,
      backupDirectory,
      live: false,
      now,
    });
    assert.equal(ready.summary.ready, true);
    assert.equal(ready.summary.block, 0);

    const stale = await runPreflight({
      packageDirectory,
      backupDirectory,
      live: false,
      now: now + 30 * 3_600_000,
    });
    assert.equal(stale.summary.ready, false);
    assert.equal(stale.summary.block, 2);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
