import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { verifyProductionExport } from "./verify-production-export.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultSource = path.join(root, ".pages-out");
const defaultDestination = path.join(root, ".production-upload");
const excludedTopLevel = new Set([
  ".github",
  ".nojekyll",
  "legacy-redirects.htaccess",
]);
const protectedWordPressPaths = new Set([
  ".htaccess",
  "index.php",
  "wp-admin",
  "wp-content",
  "wp-includes",
  "wp-json",
  "wp-config.php",
  "wp-load.php",
  "wp-login.php",
]);

function assertGeneratedDirectory(destination) {
  const allowedRoots = [root, path.resolve(os.tmpdir())];
  const allowed = allowedRoots.some((allowedRoot) => {
    const relative = path.relative(allowedRoot, destination);
    return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
  });
  if (!allowed) {
    throw new Error(
      `Refusing to replace unsafe package directory: ${destination}`,
    );
  }
}

async function copyTree(source, destination, relative = "") {
  const copied = [];
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
    if (!relative && excludedTopLevel.has(entry.name)) continue;
    if (!relative && protectedWordPressPaths.has(entry.name.toLowerCase())) {
      throw new Error(
        `Static export collides with protected WordPress path: ${entry.name}`,
      );
    }
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      copied.push(
        ...(await copyTree(sourcePath, destinationPath, childRelative)),
      );
    } else if (entry.isFile()) {
      await copyFile(sourcePath, destinationPath);
      copied.push(childRelative.replaceAll("\\", "/"));
    }
  }
  return copied;
}

async function describeFile(base, relative) {
  const absolute = path.join(base, ...relative.split("/"));
  const [content, metadata] = await Promise.all([
    readFile(absolute),
    stat(absolute),
  ]);
  return {
    path: relative,
    bytes: metadata.size,
    sha256: createHash("sha256").update(content).digest("hex"),
  };
}

export async function prepareProductionUpload({
  source = defaultSource,
  destination = defaultDestination,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sonnenblume-mg.com",
  apiMode = process.env.NEXT_PUBLIC_API_MODE || "wordpress",
} = {}) {
  source = path.resolve(source);
  destination = path.resolve(destination);
  assertGeneratedDirectory(destination);
  await verifyProductionExport(source, siteUrl, apiMode);

  await rm(destination, { recursive: true, force: true });
  const webroot = path.join(destination, "webroot");
  const serverConfig = path.join(destination, "server-config");
  const files = await copyTree(source, webroot);
  await mkdir(serverConfig, { recursive: true });
  await copyFile(
    path.join(source, "legacy-redirects.htaccess"),
    path.join(serverConfig, "legacy-redirects.htaccess"),
  );

  const described = [];
  for (const relative of files.sort()) {
    described.push(await describeFile(webroot, relative));
  }
  const legacyRules = await describeFile(
    serverConfig,
    "legacy-redirects.htaccess",
  );
  const totalBytes = described.reduce((sum, item) => sum + item.bytes, 0);
  const manifest = {
    schema: 1,
    siteUrl: siteUrl.replace(/\/$/, ""),
    generatedAt: new Date().toISOString(),
    webroot: {
      files: described.length,
      bytes: totalBytes,
      entries: described,
    },
    serverConfig: [legacyRules],
  };
  await writeFile(
    path.join(destination, "production-upload-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(destination, "README.txt"),
    [
      "SONNENBLUME production upload package",
      "",
      "1. Create and verify a fresh WordPress files + database backup before changing production.",
      "2. Upload only the CONTENTS of webroot/; do not delete existing WordPress files or directories.",
      "3. Merge server-config/legacy-redirects.htaccess before the existing # BEGIN WordPress block.",
      "4. Never replace wp-config.php, wp-admin/, wp-content/, wp-includes/ or the WordPress rewrite block.",
      "5. Verify /de/, /uk/, /wp-admin/, /wp-json/, forms, QR, old URLs and rollback before approval.",
      "",
    ].join("\n"),
    "utf8",
  );
  return { destination, files: described.length, bytes: totalBytes };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await prepareProductionUpload();
  console.log(
    `Production upload package prepared at ${result.destination}: ` +
      `${result.files} webroot files, ${result.bytes} bytes.`,
  );
}
