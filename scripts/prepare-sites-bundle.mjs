import {
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const bundleDirectory = path.resolve(".sites-bundle");
const workerPath = path.join(bundleDirectory, "worker.js");
const distDirectory = path.join(bundleDirectory, "dist");
const serverDirectory = path.join(distDirectory, "server");
const clientDirectory = path.join(distDirectory, "client");
const bundleOpenAiDirectory = path.join(distDirectory, ".openai");
const preservedBundleEntries = new Set([
  "README.md",
  "worker.js",
  "worker.js.map",
]);
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

for (const entry of await readdir(bundleDirectory, { withFileTypes: true })) {
  if (preservedBundleEntries.has(entry.name)) continue;
  await rm(path.join(bundleDirectory, entry.name), {
    recursive: entry.isDirectory(),
    force: true,
  });
}
await mkdir(serverDirectory, { recursive: true });
await cp(workerPath, path.join(serverDirectory, "index.js"));
await cp(path.resolve(".open-next", "assets"), clientDirectory, {
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
