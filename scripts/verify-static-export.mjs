import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function collectFiles(directory, current = directory, result = new Set()) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(directory, absolute, result);
    } else if (entry.isFile()) {
      result.add(path.relative(directory, absolute).split(path.sep).join("/"));
    }
  }
  return result;
}

function referencesFromHtml(source) {
  const references = [];
  for (const match of source.matchAll(/\b(?:href|src)\s*=\s*["']([^"'<>]+)["']/gi)) {
    references.push(match[1]);
  }
  for (const match of source.matchAll(/\bsrcset\s*=\s*["']([^"'<>]+)["']/gi)) {
    for (const candidate of match[1].split(",")) {
      const reference = candidate.trim().split(/\s+/, 1)[0];
      if (reference) references.push(reference);
    }
  }
  return references;
}

function referencesFromCss(source) {
  return [...source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map(
    (match) => match[1],
  );
}

function normalizeReference(reference, sourceFile, siteOrigin) {
  const trimmed = reference.trim();
  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    /^(?:data|mailto|tel|javascript):/i.test(trimmed)
  ) {
    return null;
  }

  const sourceDirectory = path.posix.dirname(`/${sourceFile}`);
  const basePath = sourceDirectory.endsWith("/")
    ? sourceDirectory
    : `${sourceDirectory}/`;
  const base = new URL(basePath, siteOrigin);
  let target;
  try {
    target = new URL(trimmed, base);
  } catch {
    return { invalid: true, reference: trimmed };
  }
  if (target.origin !== siteOrigin) return null;

  let pathname;
  try {
    pathname = decodeURIComponent(target.pathname);
  } catch {
    return { invalid: true, reference: trimmed };
  }
  if (pathname.includes("\\") || pathname.split("/").includes("..")) {
    return { invalid: true, reference: trimmed };
  }
  return pathname.replace(/^\/+/, "");
}

function targetExists(files, pathname) {
  if (!pathname) return files.has("index.html");
  if (files.has(pathname)) return true;
  if (pathname.endsWith("/")) return files.has(`${pathname}index.html`);
  return files.has(`${pathname}/index.html`) || files.has(`${pathname}.html`);
}

export async function verifyStaticExport(
  directory = path.join(root, ".pages-out"),
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://garuday.github.io",
) {
  const resolvedDirectory = path.resolve(directory);
  const info = await stat(resolvedDirectory);
  if (!info.isDirectory()) throw new Error(`Static export is not a directory: ${resolvedDirectory}`);

  const siteOrigin = new URL(siteUrl).origin;
  const files = await collectFiles(resolvedDirectory);
  const sourceFiles = [...files].filter((file) => /\.(?:html|css)$/i.test(file));
  const broken = [];
  let checkedReferences = 0;

  for (const sourceFile of sourceFiles) {
    const source = await readFile(path.join(resolvedDirectory, sourceFile), "utf8");
    const references = sourceFile.endsWith(".css")
      ? referencesFromCss(source)
      : referencesFromHtml(source);
    for (const reference of references) {
      const target = normalizeReference(reference, sourceFile, siteOrigin);
      if (target === null) continue;
      checkedReferences += 1;
      if (typeof target === "object" || !targetExists(files, target)) {
        broken.push({ source: sourceFile, reference });
      }
    }
  }

  if (broken.length) {
    const examples = broken
      .slice(0, 20)
      .map(({ source, reference }) => `${source} -> ${reference}`)
      .join("\n");
    throw new Error(
      `Static export contains ${broken.length} broken local references:\n${examples}`,
    );
  }

  return { files: files.size, sourceFiles: sourceFiles.length, checkedReferences };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
  const result = await verifyStaticExport(directory);
  console.log(
    `Static export verified: ${result.files} files, ${result.sourceFiles} HTML/CSS sources, ` +
      `${result.checkedReferences} local references.`,
  );
}
