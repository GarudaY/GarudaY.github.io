import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { parseStageArguments } from "./stage-production.mjs";

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
