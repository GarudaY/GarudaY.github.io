import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, ".pages-out");

export async function prepareGitHubPagesSegmentFiles(
  directory = outputDirectory,
) {
  let copied = 0;

  async function flattenSegments(segmentDirectory, pageDirectory) {
    for (const entry of await readdir(segmentDirectory, {
      withFileTypes: true,
    })) {
      const source = path.join(segmentDirectory, entry.name);
      if (entry.isDirectory()) {
        await flattenSegments(source, pageDirectory);
      } else if (entry.isFile() && entry.name.endsWith(".txt")) {
        const filename = path
          .relative(pageDirectory, source)
          .split(path.sep)
          .join(".");
        await copyFile(source, path.join(pageDirectory, filename));
        copied += 1;
      }
    }
  }

  async function visit(currentDirectory) {
    for (const entry of await readdir(currentDirectory, {
      withFileTypes: true,
    })) {
      if (!entry.isDirectory()) continue;
      const child = path.join(currentDirectory, entry.name);
      // Next's exporter flattens forward slashes, but Windows segment paths
      // retain backslashes and become nested directories. The client router
      // always requests dot-separated filenames, on every platform.
      if (entry.name.startsWith("__next.")) {
        await flattenSegments(child, currentDirectory);
      } else {
        await visit(child);
      }
    }
  }

  await visit(directory);
  return copied;
}

export async function prepareGitHubPagesRedirects(
  directory = outputDirectory,
  siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://garuday.github.io").replace(/\/$/, ""),
) {
  // Pages has no server redirects. Keep old links working without JavaScript.
  const redirects = [
    ["", "/de/", "de"],
    ["uk/about", "/uk/", "uk"],
    ["de/about", "/de/", "de"],
    ["de/ueber-uns", "/de/", "de"],
    ["uk/news", "/uk/events/", "uk"],
    ["de/news", "/de/events/", "de"],
    ["de/neuigkeiten", "/de/events/", "de"],
  ];

  for (const [source, target, locale] of redirects) {
    const redirectDirectory = path.join(directory, source);
    await mkdir(redirectDirectory, { recursive: true });
    const label = locale === "uk" ? "Перейти на сайт" : "Zur Website";
    await writeFile(
      path.join(redirectDirectory, "index.html"),
      `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow">
<meta http-equiv="refresh" content="0;url=${target}">
<link rel="canonical" href="${siteUrl}${target}">
<title>SONNENBLUME</title>
</head>
<body><a href="${target}">${label}</a></body>
</html>
`,
      "utf8",
    );
  }
}

export function isPreviewSiteUrl(siteUrl) {
  const hostname = new URL(siteUrl).hostname.toLowerCase();
  return hostname.endsWith(".github.io") || hostname.startsWith("staging.");
}

export async function verifyPreviewIndexProtection(
  directory = outputDirectory,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://garuday.github.io",
) {
  if (!isPreviewSiteUrl(siteUrl)) return false;

  const robots = await readFile(path.join(directory, "robots.txt"), "utf8");
  if (!/^Disallow:\s*\/$/m.test(robots)) {
    throw new Error("Preview export must disallow crawling in robots.txt.");
  }

  for (const locale of ["uk", "de"]) {
    const html = await readFile(
      path.join(directory, locale, "index.html"),
      "utf8",
    );
    if (!/<meta name="robots" content="noindex, nofollow"\s*\/?\s*>/.test(html)) {
      throw new Error(`Preview export is missing noindex metadata for ${locale}.`);
    }
  }

  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const copied = await prepareGitHubPagesSegmentFiles();
  await prepareGitHubPagesRedirects();
  await verifyPreviewIndexProtection();
  console.log(
    `GitHub Pages redirects prepared; ${copied} segment files normalized.`,
  );
}
