import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  parseStageArguments,
  verifyRemoteSamples,
} from "./stage-production.mjs";

test("production staging is a dry run unless apply is explicit", () => {
  const options = parseStageArguments([]);
  assert.equal(options.apply, false);
  assert.match(options.packageDirectory, /\.production-upload$/);
});

test("production staging requires the exact domain confirmation", () => {
  assert.throws(
    () => parseStageArguments(["--apply"]),
    /--confirm sonnenblume-mg\.com/,
  );
  assert.throws(
    () => parseStageArguments(["--apply", "--confirm", "staging"]),
    /--confirm sonnenblume-mg\.com/,
  );
  const options = parseStageArguments([
    "--apply",
    "--confirm",
    "sonnenblume-mg.com",
    "--backup",
    "backup",
  ]);
  assert.equal(options.apply, true);
  assert.equal(options.backupDirectory, path.resolve("backup"));
});

test("production staging verifies critical remote files byte-for-byte", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "ukr-stage-samples-"));
  const samples = new Map([
    ["de/index.html", Buffer.from("de")],
    ["uk/index.html", Buffer.from("uk")],
    ["robots.txt", Buffer.from("robots")],
    ["sitemap.xml", Buffer.from("sitemap")],
    ["images/donation/bank-transfer-epc-qr.png", Buffer.from("qr")],
  ]);
  try {
    await mkdir(fixture, { recursive: true });
    await writeFile(
      path.join(fixture, "production-upload-manifest.json"),
      JSON.stringify({
        webroot: {
          entries: [...samples].map(([entryPath, content]) => ({
            path: entryPath,
            bytes: content.length,
            sha256: createHash("sha256").update(content).digest("hex"),
          })),
        },
      }),
    );
    const fetchImpl = async (url) => {
      const pathname = new URL(url).pathname;
      const relative =
        pathname === "/de/"
          ? "de/index.html"
          : pathname === "/uk/"
            ? "uk/index.html"
            : pathname.slice(1);
      return new Response(samples.get(relative), { status: 200 });
    };
    const verified = await verifyRemoteSamples(fixture, { fetchImpl });
    assert.equal(verified.length, 5);

    samples.set("robots.txt", Buffer.from("tampered"));
    await assert.rejects(
      verifyRemoteSamples(fixture, { fetchImpl }),
      /checksum mismatch: \/robots\.txt/,
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
