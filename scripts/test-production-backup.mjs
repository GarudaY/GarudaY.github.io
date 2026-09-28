import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import {
  buildBackupSummary,
  findMissingCredentials,
  validateBackupDestination,
  validateBackupResumeDestination,
} from "./backup-production.mjs";

const gzipAsync = promisify(gzip);
const digest = (content) => createHash("sha256").update(content).digest("hex");

test("production backup refuses repository and existing destinations", async () => {
  const fixture = await mkdtemp(
    path.join(os.tmpdir(), "ukr-backup-destination-"),
  );
  try {
    await assert.rejects(
      validateBackupDestination(path.join(fixture, "project", "backup"), {
        projectRoot: path.join(fixture, "project"),
      }),
      /outside the repository/,
    );
    const existing = path.join(fixture, "existing");
    await mkdir(existing);
    await assert.rejects(
      validateBackupDestination(existing, {
        projectRoot: path.join(fixture, "project"),
      }),
      /already exists/,
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("production backup resumes only a marked incomplete destination", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "ukr-backup-resume-"));
  try {
    const existing = path.join(fixture, "existing");
    await mkdir(existing);
    await assert.rejects(
      validateBackupResumeDestination(existing, {
        projectRoot: path.join(fixture, "project"),
      }),
      /incomplete backup marker/,
    );
    await writeFile(path.join(existing, "INCOMPLETE.txt"), "incomplete\n");
    assert.equal(
      await validateBackupResumeDestination(existing, {
        projectRoot: path.join(fixture, "project"),
      }),
      path.resolve(existing),
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("production backup reports every missing credential without values", () => {
  assert.deepEqual(findMissingCredentials({}), [
    "SNB_FTPS_USER",
    "SNB_FTPS_PASSWORD",
    "SNB_PMA_URL",
    "SNB_DB_USER",
    "SNB_DB_PASSWORD",
    "SNB_DB_NAME",
  ]);
  assert.deepEqual(
    findMissingCredentials({
      SNB_FTPS_USER: "user",
      SNB_FTPS_PASSWORD: "secret",
      SNB_PMA_URL: "https://example.test/",
      SNB_DB_USER: "db-user",
      SNB_DB_PASSWORD: "db-secret",
      SNB_DB_NAME: "wordpress",
    }),
    [],
  );
});

test("production backup summary binds files, wp-config and database", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "ukr-backup-summary-"));
  try {
    const files = path.join(fixture, "wordpress-files");
    const siteFiles = path.join(files, "example.test");
    await mkdir(siteFiles, { recursive: true });
    const wpConfig = Buffer.from("<?php define('DB_NAME', 'private');");
    await writeFile(path.join(siteFiles, "wp-config.php"), wpConfig);
    await writeFile(path.join(fixture, "wp-config.php"), wpConfig);
    const manifest = {
      host: "example.test",
      files: [
        {
          path: "example.test/wp-config.php",
          size: wpConfig.length,
          modified: "20260927000000",
          sha256: digest(wpConfig),
        },
      ],
      total_bytes: wpConfig.length,
    };
    await writeFile(
      path.join(fixture, "wordpress-files-manifest.json"),
      JSON.stringify(manifest),
    );
    const tables = [
      "options",
      "posts",
      "postmeta",
      "users",
      "usermeta",
      "terms",
      "termmeta",
      "term_taxonomy",
      "term_relationships",
      "comments",
    ];
    const database = path.join(fixture, "database-2026-09-27.sql.gz");
    await writeFile(
      database,
      await gzipAsync(
        tables
          .map((name) => `CREATE TABLE \`wp_${name}\` (id bigint);`)
          .join("\n"),
      ),
    );
    const summary = await buildBackupSummary(fixture, database);
    assert.equal(summary.files, 1);
    assert.equal(summary.totalBytes, wpConfig.length);
    assert.equal(summary.databaseTables, 10);
    assert.equal(summary.wpConfigSource, "example.test/wp-config.php");
    assert.equal(summary.wpConfigSha256, digest(wpConfig));
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
