import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const bundleDirectory = path.resolve(".sites-bundle");
const workerPath = path.join(bundleDirectory, "worker.js");
const bundleOpenAiDirectory = path.join(bundleDirectory, ".openai");
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
await cp(workerPath, path.join(bundleDirectory, "index.js"));
await cp(path.resolve(".open-next", "assets"), bundleDirectory, {
  recursive: true,
});

await mkdir(bundleOpenAiDirectory, { recursive: true });
await cp(
  path.resolve(".openai", "hosting.json"),
  path.join(bundleOpenAiDirectory, "hosting.json"),
);
await cp(
  path.resolve(".openai", "drizzle"),
  path.join(bundleOpenAiDirectory, "drizzle"),
  { recursive: true },
);
