import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const workerPath = path.resolve(".sites-bundle", "worker.js");
const marker = "__sitesCreateRequire";
const requireShim = [
  'import { createRequire as __sitesCreateRequire } from "node:module";',
  'const require = __sitesCreateRequire("file:///worker.js");',
  "",
].join("\n");

const worker = await readFile(workerPath, "utf8");

if (!worker.includes(marker)) {
  await writeFile(workerPath, `${requireShim}${worker}`, "utf8");
}
