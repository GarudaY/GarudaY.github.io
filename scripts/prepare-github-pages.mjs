import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, ".pages-out");

export async function prepareGitHubPagesRedirects() {
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
    const directory = path.join(outputDirectory, source);
    await mkdir(directory, { recursive: true });
    const label = locale === "uk" ? "Перейти на сайт" : "Zur Website";
    await writeFile(
      path.join(directory, "index.html"),
      `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow">
<meta http-equiv="refresh" content="0;url=${target}">
<link rel="canonical" href="https://garuday.github.io${target}">
<title>SONNENBLUME</title>
</head>
<body><a href="${target}">${label}</a></body>
</html>
`,
      "utf8",
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await prepareGitHubPagesRedirects();
  console.log("GitHub Pages legacy redirects prepared.");
}
