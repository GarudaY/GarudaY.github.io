import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configurationPath = path.join(root, "scripts", "legacy-redirects.json");

function normalizePathname(value) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    throw new Error(`Legacy path must start with /: ${String(value)}`);
  }
  const url = new URL(value, "https://sonnenblume.invalid");
  if (url.origin !== "https://sonnenblume.invalid" || url.search) {
    throw new Error(
      `Legacy path must be same-origin and have no query: ${value}`,
    );
  }
  if (decodeURIComponent(url.pathname).split("/").includes("..")) {
    throw new Error(`Legacy path may not traverse directories: ${value}`);
  }
  return `${url.pathname}${url.hash}`;
}

export async function readLegacyRedirectConfiguration() {
  const parsed = JSON.parse(await readFile(configurationPath, "utf8"));
  if (!Array.isArray(parsed.sitemapPaths) || !Array.isArray(parsed.redirects)) {
    throw new Error(
      "Legacy redirect configuration is missing its path arrays.",
    );
  }
  return parsed;
}

export async function validateLegacyRedirectConfiguration() {
  const configuration = await readLegacyRedirectConfiguration();
  const inventory = configuration.sitemapPaths.map(normalizePathname);
  const redirects = configuration.redirects.map((entry) => ({
    ...entry,
    source: normalizePathname(entry.source),
    target: normalizePathname(entry.target),
  }));
  const inventorySet = new Set(inventory);
  const redirectSources = redirects.map((entry) => entry.source);
  const redirectSet = new Set(redirectSources);

  if (inventorySet.size !== inventory.length) {
    throw new Error("Legacy sitemap inventory contains duplicate paths.");
  }
  if (redirectSet.size !== redirects.length) {
    throw new Error("Legacy redirect map contains duplicate source paths.");
  }

  const missing = inventory.filter((source) => !redirectSet.has(source));
  const unknown = redirectSources.filter((source) => !inventorySet.has(source));
  if (missing.length || unknown.length) {
    throw new Error(
      `Legacy redirect coverage mismatch. Missing: ${missing.join(", ") || "none"}; ` +
        `unknown: ${unknown.join(", ") || "none"}.`,
    );
  }

  for (const entry of redirects) {
    if (!entry.reason?.trim()) {
      throw new Error(`Legacy redirect lacks a reason: ${entry.source}`);
    }
    if (entry.source === entry.target) {
      throw new Error(`Legacy redirect loops to itself: ${entry.source}`);
    }
  }

  return { ...configuration, sitemapPaths: inventory, redirects };
}

function exportPathForTarget(outputDirectory, target) {
  const { pathname } = new URL(target, "https://sonnenblume.invalid");
  const relative = decodeURIComponent(pathname).replace(/^\/+/, "");
  return pathname.endsWith("/")
    ? path.join(outputDirectory, relative, "index.html")
    : path.join(outputDirectory, relative);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function getLegacyRedirectDirectory(outputDirectory, source) {
  const decoded = decodeURIComponent(
    new URL(source, "https://sonnenblume.invalid").pathname,
  );
  return path.join(outputDirectory, decoded.replace(/^\/+|\/+$/g, ""));
}

export function renderLegacyRedirectHtml({ target, locale = "de", siteUrl }) {
  const label = locale === "uk" ? "Перейти на сайт" : "Zur Website";
  const safeTarget = escapeHtml(target);
  const canonical = escapeHtml(
    new URL(target, `${siteUrl.replace(/\/$/, "")}/`).toString(),
  );
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow">
<meta http-equiv="refresh" content="0;url=${safeTarget}">
<link rel="canonical" href="${canonical}">
<title>SONNENBLUME</title>
</head>
<body><a href="${safeTarget}">${label}</a></body>
</html>
`;
}

export function renderApacheLegacyRedirects(redirects) {
  const rules = redirects.map(({ source, target }) => {
    const decoded = decodeURIComponent(
      new URL(source, "https://sonnenblume.invalid").pathname,
    );
    const trimmed = decoded.replace(/^\/+|\/+$/g, "");
    const pattern = trimmed ? `^${escapeRegExp(trimmed)}/?$` : "^$";
    return `RewriteRule ${pattern} ${target} [R=301,L,NE]`;
  });
  return `# BEGIN SONNENBLUME legacy redirects
# Generated from scripts/legacy-redirects.json. Place this block before WordPress rules.
<IfModule mod_rewrite.c>
RewriteEngine On
${rules.join("\n")}
</IfModule>
# END SONNENBLUME legacy redirects
`;
}

export async function verifyLegacyRedirectTargets(outputDirectory) {
  const configuration = await validateLegacyRedirectConfiguration();
  for (const entry of configuration.redirects) {
    const targetFile = exportPathForTarget(outputDirectory, entry.target);
    try {
      await access(targetFile);
    } catch {
      throw new Error(
        `${entry.source} points to missing export target ${entry.target}`,
      );
    }

    const targetUrl = new URL(entry.target, "https://sonnenblume.invalid");
    if (targetUrl.hash && targetFile.endsWith(".html")) {
      const id = decodeURIComponent(targetUrl.hash.slice(1));
      const html = await readFile(targetFile, "utf8");
      const anchorPattern = new RegExp(`\\bid=["']${escapeRegExp(id)}["']`);
      if (!anchorPattern.test(html)) {
        throw new Error(
          `${entry.source} points to missing anchor ${entry.target}`,
        );
      }
    }
  }
  return configuration.redirects.length;
}

async function fetchLiveSitemapPaths(source) {
  const rootResponse = await fetch(source);
  if (!rootResponse.ok)
    throw new Error(`Sitemap request failed: ${rootResponse.status}`);
  const rootXml = await rootResponse.text();
  const children = [...rootXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  const urls = [];
  for (const child of children) {
    const response = await fetch(child);
    if (!response.ok)
      throw new Error(`Sitemap request failed: ${response.status} ${child}`);
    urls.push(
      ...[...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
        (match) => match[1],
      ),
    );
  }
  return [...new Set(urls.map((url) => new URL(url).pathname))].sort();
}

export async function verifyLiveLegacySitemap() {
  const configuration = await validateLegacyRedirectConfiguration();
  const live = await fetchLiveSitemapPaths(configuration.source);
  const captured = [...configuration.sitemapPaths].sort();
  if (JSON.stringify(live) !== JSON.stringify(captured)) {
    const capturedSet = new Set(captured);
    const liveSet = new Set(live);
    const added = live.filter((item) => !capturedSet.has(item));
    const removed = captured.filter((item) => !liveSet.has(item));
    throw new Error(
      `Live legacy sitemap changed. Added: ${added.join(", ") || "none"}; ` +
        `removed: ${removed.join(", ") || "none"}.`,
    );
  }
  return live.length;
}

async function main() {
  const args = process.argv.slice(2);
  const outputFlag = args.indexOf("--output");
  const apacheFlag = args.indexOf("--apache");
  const configuration = await validateLegacyRedirectConfiguration();
  let message = `Verified ${configuration.redirects.length} legacy redirects`;

  if (outputFlag >= 0) {
    const outputDirectory = path.resolve(args[outputFlag + 1]);
    const count = await verifyLegacyRedirectTargets(outputDirectory);
    message += ` and ${count} export targets`;
  }
  if (args.includes("--fetch-live")) {
    const count = await verifyLiveLegacySitemap();
    message += `; live sitemap still contains ${count} paths`;
  }
  if (apacheFlag >= 0) {
    const destination = path.resolve(args[apacheFlag + 1]);
    await writeFile(
      destination,
      renderApacheLegacyRedirects(configuration.redirects),
      "utf8",
    );
    message += `; wrote ${destination}`;
  }
  console.log(`${message}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
