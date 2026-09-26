import { createHash } from "node:crypto";
import { resolveMx, resolveTxt } from "node:dns/promises";
import { access, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import tls from "node:tls";
import { fileURLToPath } from "node:url";

const gunzipAsync = promisify(gunzip);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SITE_URL = "https://sonnenblume-mg.com";
const DEFAULT_MAX_AGE_HOURS = 24;

function result(level, check, message, details = {}) {
  return { level, check, message, ...details };
}

function normalizeRelative(relative) {
  if (
    typeof relative !== "string" ||
    relative.length === 0 ||
    relative.includes("\\") ||
    relative.startsWith("/") ||
    relative.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error(`Unsafe manifest path: ${relative}`);
  }
  return relative;
}

async function listFiles(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory())
      files.push(...(await listFiles(absolute, relative)));
    else if (entry.isFile()) files.push(relative.replaceAll("\\", "/"));
  }
  return files;
}

async function describeFile(base, relative) {
  normalizeRelative(relative);
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

function validateManifestEntries(entries, label) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(`${label} manifest has no files`);
  }
  const seen = new Set();
  for (const entry of entries) {
    normalizeRelative(entry.path);
    if (seen.has(entry.path))
      throw new Error(`Duplicate ${label} path: ${entry.path}`);
    seen.add(entry.path);
    if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0) {
      throw new Error(`Invalid byte count for ${entry.path}`);
    }
    if (!/^[a-f0-9]{64}$/.test(entry.sha256)) {
      throw new Error(`Invalid SHA-256 for ${entry.path}`);
    }
  }
}

export async function verifyProductionPackage(
  packageDirectory,
  {
    siteUrl = DEFAULT_SITE_URL,
    now = Date.now(),
    maxAgeHours = DEFAULT_MAX_AGE_HOURS,
  } = {},
) {
  const manifestPath = path.join(
    packageDirectory,
    "production-upload-manifest.json",
  );
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const expectedSite = siteUrl.replace(/\/$/, "");
  if (manifest.schema !== 1)
    throw new Error("Unsupported production manifest schema");
  if (manifest.siteUrl !== expectedSite) {
    throw new Error(
      `Production package targets ${manifest.siteUrl}, expected ${expectedSite}`,
    );
  }
  const generatedAt = Date.parse(manifest.generatedAt);
  if (!Number.isFinite(generatedAt))
    throw new Error("Invalid package generatedAt");
  const ageHours = (now - generatedAt) / 3_600_000;
  if (ageHours < -0.25)
    throw new Error("Production package is dated in the future");

  validateManifestEntries(manifest.webroot?.entries, "webroot");
  validateManifestEntries(manifest.serverConfig, "server configuration");
  const webroot = path.join(packageDirectory, "webroot");
  const serverConfig = path.join(packageDirectory, "server-config");
  const actualFiles = (await listFiles(webroot)).sort();
  const expectedFiles = manifest.webroot.entries
    .map((entry) => entry.path)
    .sort();
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error(
      "Webroot contents do not exactly match the production manifest",
    );
  }

  const verified = [];
  for (const entry of manifest.webroot.entries) {
    verified.push(await describeFile(webroot, entry.path));
  }
  for (const entry of manifest.serverConfig) {
    verified.push(await describeFile(serverConfig, entry.path));
  }
  const expected = [...manifest.webroot.entries, ...manifest.serverConfig];
  for (let index = 0; index < expected.length; index += 1) {
    if (
      expected[index].bytes !== verified[index].bytes ||
      expected[index].sha256 !== verified[index].sha256
    ) {
      throw new Error(
        `Production package checksum mismatch: ${expected[index].path}`,
      );
    }
  }
  const totalBytes = manifest.webroot.entries.reduce(
    (sum, entry) => sum + entry.bytes,
    0,
  );
  if (
    manifest.webroot.files !== manifest.webroot.entries.length ||
    manifest.webroot.bytes !== totalBytes
  ) {
    throw new Error("Production package totals do not match its entries");
  }
  return {
    files: manifest.webroot.files,
    bytes: totalBytes,
    generatedAt: new Date(generatedAt).toISOString(),
    ageHours,
    fresh: ageHours <= maxAgeHours,
  };
}

export async function findLatestBackup(documentsDirectory) {
  const candidates = [];
  for (const entry of await readdir(documentsDirectory, {
    withFileTypes: true,
  })) {
    if (
      !entry.isDirectory() ||
      !entry.name.startsWith("SONNENBLUME-private-backup-")
    ) {
      continue;
    }
    const absolute = path.join(documentsDirectory, entry.name);
    candidates.push({ absolute, modified: (await stat(absolute)).mtimeMs });
  }
  candidates.sort((left, right) => right.modified - left.modified);
  return candidates[0]?.absolute ?? null;
}

export async function inspectBackup(
  backupDirectory,
  { now = Date.now(), maxAgeHours = DEFAULT_MAX_AGE_HOURS } = {},
) {
  const manifestPath = path.join(
    backupDirectory,
    "wordpress-files-manifest.json",
  );
  const wordpressRoot = path.join(backupDirectory, "wordpress-files");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    throw new Error("WordPress backup manifest has no files");
  }
  const seen = new Set();
  let totalBytes = 0;
  for (const entry of manifest.files) {
    normalizeRelative(entry.path);
    if (seen.has(entry.path))
      throw new Error(`Duplicate backup path: ${entry.path}`);
    seen.add(entry.path);
    if (!Number.isSafeInteger(entry.size) || entry.size < 0) {
      throw new Error(`Invalid backup size for ${entry.path}`);
    }
    if (!/^[a-f0-9]{64}$/.test(entry.sha256)) {
      throw new Error(`Invalid backup SHA-256 for ${entry.path}`);
    }
    totalBytes += entry.size;
  }
  if (manifest.total_bytes !== totalBytes) {
    throw new Error("WordPress backup total_bytes does not match its entries");
  }

  for (const entry of manifest.files) {
    const file = path.join(wordpressRoot, ...entry.path.split("/"));
    const metadata = await stat(file);
    if (!metadata.isFile() || metadata.size !== entry.size) {
      throw new Error(`Backup file size mismatch: ${entry.path}`);
    }
  }

  const databaseFiles = (await readdir(backupDirectory))
    .filter((name) => /^database-\d{4}-\d{2}-\d{2}\.sql\.gz$/.test(name))
    .sort();
  if (databaseFiles.length === 0)
    throw new Error("Backup has no database SQL gzip");
  const database = path.join(backupDirectory, databaseFiles.at(-1));
  const [manifestStat, databaseStat, compressed] = await Promise.all([
    stat(manifestPath),
    stat(database),
    readFile(database),
    access(wordpressRoot),
    access(path.join(backupDirectory, "wp-config.php")),
  ]);
  const sql = (await gunzipAsync(compressed)).toString("utf8");
  if (!/CREATE TABLE [`\"]?[^\s]+options/i.test(sql)) {
    throw new Error("Database dump does not contain a WordPress options table");
  }
  const capturedAt = Math.min(manifestStat.mtimeMs, databaseStat.mtimeMs);
  const ageHours = (now - capturedAt) / 3_600_000;
  if (ageHours < -0.25) throw new Error("Backup is dated in the future");
  return {
    directory: backupDirectory,
    files: manifest.files.length,
    bytes: manifest.total_bytes,
    database: path.basename(database),
    capturedAt: new Date(capturedAt).toISOString(),
    ageHours,
    fresh: ageHours <= maxAgeHours,
  };
}

async function fetchCheck(base, relative, accepted) {
  const response = await fetch(new URL(relative, base), {
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
    headers: { "User-Agent": "Sonnenblume production preflight/1.0" },
  });
  const text = await response.text();
  return {
    ok: accepted(response.status),
    status: response.status,
    contentType: response.headers.get("content-type"),
    location: response.headers.get("location"),
    body: text,
  };
}

async function inspectTls(hostname) {
  return await new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, timeout: 20_000 },
      () => {
        const certificate = socket.getPeerCertificate();
        const validTo = Date.parse(certificate.valid_to);
        socket.end();
        if (!Number.isFinite(validTo))
          reject(new Error("TLS certificate has no valid_to"));
        else
          resolve({
            validTo: new Date(validTo).toISOString(),
            daysRemaining: (validTo - Date.now()) / 86_400_000,
          });
      },
    );
    socket.once("timeout", () =>
      socket.destroy(new Error("TLS connection timed out")),
    );
    socket.once("error", reject);
  });
}

function errorMessage(error) {
  return error?.message || error?.code || String(error);
}

async function inspectRedirect(
  source,
  destination,
  check,
  failureLevel = "block",
) {
  try {
    const response = await fetchCheck(
      new URL(source),
      "/",
      (status) => status >= 300 && status < 400,
    );
    const location = response.location
      ? new URL(response.location, source).toString()
      : null;
    const expected = new URL(destination).toString();
    const ok = response.ok && location === expected;
    return result(
      ok ? "pass" : failureLevel,
      check,
      ok
        ? `${source} redirects to ${expected}.`
        : `${source} returned HTTP ${response.status} and location ${location ?? "none"}; expected ${expected}.`,
      { status: response.status, location },
    );
  } catch (error) {
    return result(
      failureLevel,
      check,
      `${source} redirect check failed: ${errorMessage(error)}`,
    );
  }
}

export async function inspectLiveProduction(siteUrl = DEFAULT_SITE_URL) {
  const base = new URL(siteUrl);
  const checks = [];
  try {
    const rootResponse = await fetchCheck(
      base,
      "/",
      (status) => status === 200,
    );
    const oldWordPress =
      /wp-content\/(themes|plugins)|<meta[^>]+generator[^>]+WordPress/i.test(
        rootResponse.body,
      );
    checks.push(
      result(
        rootResponse.ok ? "pass" : "block",
        "live-root",
        `Production root returned HTTP ${rootResponse.status}${oldWordPress ? " and still serves the old WordPress site" : ""}.`,
        { status: rootResponse.status, oldWordPress },
      ),
    );
  } catch (error) {
    checks.push(
      result(
        "block",
        "live-root",
        `Production root failed: ${errorMessage(error)}`,
      ),
    );
  }
  checks.push(
    await inspectRedirect(
      `http://${base.hostname}/`,
      `${base.origin}/`,
      "canonical-http",
    ),
  );
  checks.push(
    await inspectRedirect(
      `https://www.${base.hostname}/`,
      `${base.origin}/`,
      "canonical-www",
    ),
  );
  try {
    const api = await fetchCheck(base, "/wp-json/", (status) => status === 200);
    const json = JSON.parse(api.body);
    checks.push(
      result(
        api.ok && typeof json === "object" ? "pass" : "block",
        "wordpress-api",
        `WordPress REST API returned HTTP ${api.status}.`,
        { status: api.status },
      ),
    );
  } catch (error) {
    checks.push(
      result(
        "block",
        "wordpress-api",
        `WordPress REST API failed: ${errorMessage(error)}`,
      ),
    );
  }
  try {
    const admin = await fetchCheck(
      base,
      "/wp-admin/",
      (status) => status >= 200 && status < 400,
    );
    checks.push(
      result(
        admin.ok ? "pass" : "block",
        "wordpress-admin",
        `WordPress admin entry returned HTTP ${admin.status}.`,
        { status: admin.status, location: admin.location },
      ),
    );
  } catch (error) {
    checks.push(
      result(
        "block",
        "wordpress-admin",
        `WordPress admin entry failed: ${errorMessage(error)}`,
      ),
    );
  }
  try {
    const tlsState = await inspectTls(base.hostname);
    checks.push(
      result(
        tlsState.daysRemaining >= 14 ? "pass" : "block",
        "tls",
        `TLS certificate is valid for ${Math.floor(tlsState.daysRemaining)} more days.`,
        tlsState,
      ),
    );
  } catch (error) {
    checks.push(
      result("block", "tls", `TLS verification failed: ${errorMessage(error)}`),
    );
  }
  try {
    const mx = await resolveMx(base.hostname);
    checks.push(
      result(
        mx.length > 0 ? "pass" : "block",
        "mail-dns",
        `${mx.length} MX record${mx.length === 1 ? "" : "s"} remain published for the domain.`,
        {
          records: mx.map(({ exchange, priority }) => ({ exchange, priority })),
        },
      ),
    );
  } catch (error) {
    checks.push(
      result("block", "mail-dns", `MX lookup failed: ${errorMessage(error)}`),
    );
  }
  try {
    const [rootTxt, dmarcTxt] = await Promise.all([
      resolveTxt(base.hostname),
      resolveTxt(`_dmarc.${base.hostname}`),
    ]);
    const rootRecords = rootTxt.map((parts) => parts.join(""));
    const dmarcRecords = dmarcTxt.map((parts) => parts.join(""));
    const spf = rootRecords.find((record) => record.startsWith("v=spf1"));
    const dmarc = dmarcRecords.find((record) => record.startsWith("v=DMARC1"));
    checks.push(
      result(
        spf && dmarc ? "pass" : "warn",
        "mail-policy-dns",
        spf && dmarc
          ? "SPF and DMARC records remain published for the domain."
          : `Mail policy DNS is incomplete (SPF ${spf ? "present" : "missing"}, DMARC ${dmarc ? "present" : "missing"}).`,
        { spf: spf ?? null, dmarc: dmarc ?? null },
      ),
    );
  } catch (error) {
    checks.push(
      result(
        "warn",
        "mail-policy-dns",
        `SPF/DMARC lookup failed: ${errorMessage(error)}`,
      ),
    );
  }
  for (const alias of ["sonnenblume-mg.de", "sonnenblume-mg.org"]) {
    checks.push(
      await inspectRedirect(
        `http://${alias}/`,
        `${base.origin}/`,
        `alias-http-${alias}`,
        "warn",
      ),
    );
    try {
      await inspectTls(alias);
      checks.push(
        await inspectRedirect(
          `https://${alias}/`,
          `${base.origin}/`,
          `alias-https-${alias}`,
          "warn",
        ),
      );
    } catch (error) {
      checks.push(
        result(
          "warn",
          `alias-https-${alias}`,
          `HTTPS alias is not certificate-safe: ${errorMessage(error)}.`,
        ),
      );
    }
  }
  return checks;
}

export function summarize(results) {
  const counts = { pass: 0, warn: 0, block: 0 };
  for (const item of results) counts[item.level] += 1;
  return { ...counts, ready: counts.block === 0 };
}

export async function runPreflight({
  packageDirectory = path.join(root, ".production-upload"),
  backupDirectory,
  documentsDirectory = path.dirname(root),
  siteUrl = DEFAULT_SITE_URL,
  maxAgeHours = DEFAULT_MAX_AGE_HOURS,
  live = true,
  now = Date.now(),
} = {}) {
  const results = [];
  try {
    const packageState = await verifyProductionPackage(packageDirectory, {
      siteUrl,
      maxAgeHours,
      now,
    });
    results.push(
      result(
        packageState.fresh ? "pass" : "block",
        "production-package",
        `Production package contains ${packageState.files} verified files and is ${packageState.ageHours.toFixed(1)} hours old.`,
        packageState,
      ),
    );
  } catch (error) {
    results.push(result("block", "production-package", error.message));
  }

  const selectedBackup =
    backupDirectory || (await findLatestBackup(documentsDirectory));
  if (!selectedBackup) {
    results.push(
      result(
        "block",
        "fresh-backup",
        "No private WordPress backup directory was found.",
      ),
    );
  } else {
    try {
      const backupState = await inspectBackup(selectedBackup, {
        maxAgeHours,
        now,
      });
      results.push(
        result(
          backupState.fresh ? "pass" : "block",
          "fresh-backup",
          `Files + database backup is ${backupState.ageHours.toFixed(1)} hours old (${backupState.files} files).`,
          backupState,
        ),
      );
    } catch (error) {
      results.push(result("block", "fresh-backup", error.message));
    }
  }
  if (live) results.push(...(await inspectLiveProduction(siteUrl)));
  return {
    schema: 1,
    generatedAt: new Date(now).toISOString(),
    siteUrl: siteUrl.replace(/\/$/, ""),
    checks: results,
    summary: summarize(results),
  };
}

function parseCli(args) {
  const options = { live: true };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--offline") options.live = false;
    else if (arg === "--backup")
      options.backupDirectory = path.resolve(args[++index]);
    else if (arg === "--package")
      options.packageDirectory = path.resolve(args[++index]);
    else if (arg === "--max-age-hours")
      options.maxAgeHours = Number(args[++index]);
    else if (arg === "--output") options.output = path.resolve(args[++index]);
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (
    !Number.isFinite(options.maxAgeHours ?? DEFAULT_MAX_AGE_HOURS) ||
    (options.maxAgeHours ?? DEFAULT_MAX_AGE_HOURS) <= 0
  ) {
    throw new Error("--max-age-hours must be a positive number");
  }
  return options;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseCli(process.argv.slice(2));
  const output = options.output;
  delete options.output;
  const report = await runPreflight(options);
  if (output)
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  for (const check of report.checks) {
    console.log(
      `${check.level.toUpperCase().padEnd(5)} ${check.check}: ${check.message}`,
    );
  }
  console.log(
    `Summary: ${report.summary.pass} passed, ${report.summary.warn} warnings, ${report.summary.block} blockers.`,
  );
  if (output) console.log(`Report: ${output}`);
  if (!report.summary.ready) process.exitCode = 1;
}
