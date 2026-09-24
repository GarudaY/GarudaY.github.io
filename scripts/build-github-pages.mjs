import { cp, mkdir, rm, symlink, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  prepareGitHubPagesRedirects,
  prepareGitHubPagesSegmentFiles,
  verifyPreviewIndexProtection,
} from "./prepare-github-pages.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workDirectory = path.join(root, ".pages-work");
const outputDirectory = path.join(root, ".pages-out");
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://garuday.github.io"
).replace(/\/$/, "");
const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL || siteUrl
).replace(/\/$/, "");
const apiMode = process.env.NEXT_PUBLIC_API_MODE || "wordpress";

function assertGeneratedPath(target) {
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to modify a path outside the project: ${target}`);
  }
}

async function run(command, args, options) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      shell: false,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

for (const generatedPath of [workDirectory, outputDirectory]) {
  assertGeneratedPath(generatedPath);
  await rm(generatedPath, { recursive: true, force: true });
}

await mkdir(workDirectory, { recursive: true });

for (const entry of [
  "src",
  "public",
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "postcss.config.mjs",
]) {
  await cp(path.join(root, entry), path.join(workDirectory, entry), {
    recursive: true,
  });
}

await symlink(
  path.join(root, "node_modules"),
  path.join(workDirectory, "node_modules"),
  process.platform === "win32" ? "junction" : "dir",
);

for (const serverOnlyPath of [
  path.join(workDirectory, "src", "app", "api"),
  path.join(workDirectory, "src", "app", "[locale]", "admin"),
  path.join(workDirectory, "src", "app", "[locale]", "registration", "[token]"),
  path.join(workDirectory, "src", "middleware.ts"),
]) {
  assertGeneratedPath(serverOnlyPath);
  await rm(serverOnlyPath, { recursive: true, force: true });
}

// Metadata Route Handlers must be explicitly static for output:export.
// Keep that literal config only in the generated copy, never freeze the runtime CMS sitemap.
const sitemapPath = path.join(workDirectory, "src", "app", "sitemap.ts");
assertGeneratedPath(sitemapPath);
await writeFile(
  sitemapPath,
  'import buildSitemap from "@/server/site-sitemap";\nexport const dynamic = "force-static";\nexport default async function sitemap() { return buildSitemap(); }\n',
  "utf8",
);

// Capture feeds once before Next workers start. All generated pages use the same published data.
const peoplePagePath = path.join(
  workDirectory,
  "src",
  "app",
  "[locale]",
  "people",
  "[slug]",
  "page.tsx",
);
assertGeneratedPath(peoplePagePath);
const peoplePage = await readFile(peoplePagePath, "utf8");
await writeFile(
  peoplePagePath,
  peoplePage +
    '\nexport async function generateStaticParams() { const { getStaticPersonParams } = await import("@/server/person-static-params"); return getStaticPersonParams(); }\n',
  "utf8",
);

const coursePagePath = path.join(
  workDirectory,
  "src",
  "app",
  "[locale]",
  "courses",
  "[slug]",
  "page.tsx",
);
assertGeneratedPath(coursePagePath);
const coursePage = await readFile(coursePagePath, "utf8");
await writeFile(
  coursePagePath,
  coursePage +
    '\nexport async function generateStaticParams() { const { getStaticCourseParams } = await import("@/server/course-static-params"); return getStaticCourseParams(); }\n',
  "utf8",
);

const eventPagePath = path.join(
  workDirectory,
  "src",
  "app",
  "[locale]",
  "events",
  "[slug]",
  "page.tsx",
);
assertGeneratedPath(eventPagePath);
const eventPage = await readFile(eventPagePath, "utf8");
await writeFile(
  eventPagePath,
  eventPage +
    '\nexport async function generateStaticParams() { const { getStaticEventParams } = await import("@/server/event-static-params"); return getStaticEventParams(); }\n',
  "utf8",
);

await run(
  process.execPath,
  [
    "--experimental-strip-types",
    path.join(root, "scripts", "prepare-cms-snapshot.mjs"),
    workDirectory,
  ],
  {
    cwd: root,
    env: process.env,
  },
);

await run(
  process.execPath,
  [
    path.join(root, "node_modules", "next", "dist", "bin", "next"),
    "build",
    "--webpack",
  ],
  {
    cwd: workDirectory,
    env: {
      ...process.env,
      GITHUB_PAGES_EXPORT: "true",
      NEXT_PUBLIC_STATIC_EXPORT: "true",
      NEXT_PUBLIC_SITE_URL: siteUrl,
      NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
      NEXT_PUBLIC_API_MODE: apiMode,
    },
  },
);

await cp(path.join(workDirectory, "out"), outputDirectory, { recursive: true });
await cp(
  path.join(root, ".github", "workflows", "pages.yml"),
  path.join(outputDirectory, ".github", "workflows", "pages.yml"),
  { recursive: true },
);
await writeFile(path.join(outputDirectory, ".nojekyll"), "", "utf8");
await prepareGitHubPagesSegmentFiles();
await prepareGitHubPagesRedirects(outputDirectory, siteUrl);
await verifyPreviewIndexProtection(outputDirectory, siteUrl);

console.log(`GitHub Pages export ready: ${outputDirectory}`);
