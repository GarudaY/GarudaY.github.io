import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync, gzipSync } from "node:zlib";

const input = process.argv[2];
const output = process.argv[3];
const sourceUser = process.env.SNB_SOURCE_DB_USER;
const stagingUser = process.env.SNB_STAGE_DB_USER;

if (!input || !output || !sourceUser || !stagingUser) {
  throw new Error(
    "Usage: prepare-wordpress-staging-db.mjs <input.sql.gz> <output.sql.gz> with " +
      "SNB_SOURCE_DB_USER and SNB_STAGE_DB_USER set.",
  );
}
if (!/^[a-z0-9_]+$/i.test(sourceUser) || !/^[a-z0-9_]+$/i.test(stagingUser)) {
  throw new Error("Database usernames contain unsupported characters.");
}

const compressed = await readFile(input);
if (!compressed.subarray(0, 2).equals(Buffer.from([0x1f, 0x8b]))) {
  throw new Error("Input is not a gzip-compressed SQL dump.");
}
let sql = gunzipSync(compressed).toString("utf8");
const sourceDefiner = `DEFINER=\`${sourceUser}\`@\`localhost\``;
const stagingDefiner = `DEFINER=\`${stagingUser}\`@\`localhost\``;
const definerCount = sql.split(sourceDefiner).length - 1;
if (definerCount < 1) {
  throw new Error("No production database definers were found in the SQL dump.");
}
sql = sql.replaceAll(sourceDefiner, stagingDefiner);
if (sql.includes(sourceDefiner)) {
  throw new Error("Production database definer remained after transformation.");
}

const transformed = gzipSync(Buffer.from(sql, "utf8"), { level: 9 });
await writeFile(output, transformed, { flag: "wx" });
process.stdout.write(`${JSON.stringify({
  output,
  definersRewritten: definerCount,
  compressedBytes: transformed.length,
  sqlBytes: Buffer.byteLength(sql),
  sha256: createHash("sha256").update(transformed).digest("hex"),
})}\n`);
