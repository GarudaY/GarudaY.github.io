import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isPreviewSiteUrl } from "./prepare-github-pages.mjs";
import { validateLegacyRedirectConfiguration } from "./legacy-redirects.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutputDirectory = path.join(root, ".pages-out");
const forbiddenOriginPattern =
  /garuday\.github\.io|chatgpt\.site|staging\.sonnenblume-mg\.com|localhost(?::|\/)|127\.0\.0\.1/gi;

async function collectTextFiles(directory, current = directory) {
  const files = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (entry.name === ".github") continue;
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTextFiles(directory, absolute)));
    } else if (/\.(?:html|js|json|xml|txt)$/i.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

export async function verifyProductionExport(
  directory = defaultOutputDirectory,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://garuday.github.io",
  apiMode = process.env.NEXT_PUBLIC_API_MODE || "next",
) {
  if (isPreviewSiteUrl(siteUrl)) return false;

  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
  const parsedSiteUrl = new URL(normalizedSiteUrl);
  if (parsedSiteUrl.protocol !== "https:") {
    throw new Error("Production export must use an HTTPS site URL.");
  }
  if (apiMode !== "wordpress") {
    throw new Error(
      "ALL-INKL production export must use the WordPress API mode.",
    );
  }

  const robots = await readFile(path.join(directory, "robots.txt"), "utf8");
  if (!/^Allow:\s*\/$/m.test(robots) || /^Disallow:\s*\/$/m.test(robots)) {
    throw new Error("Production robots.txt must allow crawling.");
  }
  if (!robots.includes(`Sitemap: ${normalizedSiteUrl}/sitemap.xml`)) {
    throw new Error(
      "Production robots.txt points to the wrong sitemap origin.",
    );
  }

  const sitemap = await readFile(path.join(directory, "sitemap.xml"), "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  if (!sitemapUrls.length) throw new Error("Production sitemap is empty.");
  const foreignSitemapUrl = sitemapUrls.find(
    (url) => !url.startsWith(`${normalizedSiteUrl}/`),
  );
  if (foreignSitemapUrl) {
    throw new Error(
      `Production sitemap contains a foreign URL: ${foreignSitemapUrl}`,
    );
  }

  const home = await readFile(path.join(directory, "de", "index.html"), "utf8");
  if (!home.includes(`<link rel="canonical" href="${normalizedSiteUrl}/de/"`)) {
    throw new Error("German home page has the wrong production canonical URL.");
  }
  if (/<meta name="robots" content="noindex/i.test(home)) {
    throw new Error("Production home page must not contain noindex metadata.");
  }

  let hasContactEndpoint = false;
  let hasRegistrationEndpoint = false;
  for (const file of await collectTextFiles(directory)) {
    const content = await readFile(file, "utf8");
    const forbidden = content.match(forbiddenOriginPattern);
    forbiddenOriginPattern.lastIndex = 0;
    if (forbidden) {
      throw new Error(
        `${path.relative(directory, file)} contains forbidden origin ${forbidden[0]}.`,
      );
    }
    hasContactEndpoint ||= content.includes("/wp-json/sonnenblume/v1/contact");
    hasRegistrationEndpoint ||= content.includes(
      "/wp-json/sonnenblume/v1/registrations",
    );
  }
  if (!hasContactEndpoint || !hasRegistrationEndpoint) {
    throw new Error(
      "Production client bundle is missing WordPress form endpoints.",
    );
  }

  const legacy = await validateLegacyRedirectConfiguration();
  const apache = await readFile(
    path.join(directory, "legacy-redirects.htaccess"),
    "utf8",
  );
  const ruleCount = (apache.match(/^RewriteRule /gm) ?? []).length;
  if (ruleCount !== legacy.redirects.length) {
    throw new Error(
      `Production Apache block has ${ruleCount} rules; expected ${legacy.redirects.length}.`,
    );
  }

  return {
    files: (await collectTextFiles(directory)).length,
    sitemapUrls: sitemapUrls.length,
    legacyRedirects: ruleCount,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await verifyProductionExport();
  if (result === false) {
    console.log("Preview export detected; production-only checks skipped.");
  } else {
    console.log(
      `Production export verified: ${result.files} text files, ` +
        `${result.sitemapUrls} sitemap URLs, ${result.legacyRedirects} legacy redirects.`,
    );
  }
}
