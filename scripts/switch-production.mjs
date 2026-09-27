import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeHtaccess } from "./merge-production-htaccess.mjs";
import { verifyRemoteSamples } from "./stage-production.mjs";
import {
  findLatestBackup,
  runPreflight,
} from "./verify-production-cutover.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const productionDomain = "sonnenblume-mg.com";
const productionOrigin = `https://${productionDomain}`;

function run(command, args, environment = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: environment,
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `${command} exited with ${code ?? `signal ${signal ?? "unknown"}`}`,
          ),
        );
    });
  });
}

export function parseSwitchArguments(args) {
  const options = {
    apply: false,
    packageDirectory: path.join(root, ".production-upload"),
    documentsDirectory: path.dirname(root),
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--apply") options.apply = true;
    else if (argument === "--package")
      options.packageDirectory = path.resolve(args[++index]);
    else if (argument === "--backup")
      options.backupDirectory = path.resolve(args[++index]);
    else if (argument === "--confirm") options.confirm = args[++index];
    else if (argument === "--host") options.host = args[++index];
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (options.apply && options.confirm !== productionDomain) {
    throw new Error(`Production switch requires --confirm ${productionDomain}`);
  }
  return options;
}

async function fetchWithoutRedirect(fetchImpl, siteUrl, pathname) {
  return fetchImpl(new URL(pathname, siteUrl), {
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
    headers: { "User-Agent": "Sonnenblume production switch verification/1.0" },
  });
}

export async function verifyCutoverLive({
  fetchImpl = fetch,
  siteUrl = productionOrigin,
} = {}) {
  const expectedRoot = new URL("/de/", siteUrl).toString();
  const rootResponse = await fetchWithoutRedirect(fetchImpl, siteUrl, "/");
  const rootLocation = rootResponse.headers.get("location");
  if (
    rootResponse.status < 300 ||
    rootResponse.status >= 400 ||
    new URL(rootLocation || "/", siteUrl).toString() !== expectedRoot
  ) {
    throw new Error(
      `Production root did not redirect to ${expectedRoot} (HTTP ${rootResponse.status}, location ${rootLocation || "none"})`,
    );
  }

  const legacyResponse = await fetchWithoutRedirect(
    fetchImpl,
    siteUrl,
    "/spenden/",
  );
  const legacyLocation = legacyResponse.headers.get("location");
  const expectedLegacy = new URL("/de/donate/", siteUrl).toString();
  if (
    legacyResponse.status !== 301 ||
    new URL(legacyLocation || "/", siteUrl).toString() !== expectedLegacy
  ) {
    throw new Error(
      `Legacy donation URL did not redirect to ${expectedLegacy} (HTTP ${legacyResponse.status})`,
    );
  }

  const apiResponse = await fetchImpl(new URL("/wp-json/", siteUrl), {
    signal: AbortSignal.timeout(20_000),
    headers: { "User-Agent": "Sonnenblume production switch verification/1.0" },
  });
  if (apiResponse.status !== 200) {
    throw new Error(`WordPress API returned HTTP ${apiResponse.status}`);
  }
  const api = await apiResponse.json();
  if (!api || typeof api !== "object") {
    throw new Error("WordPress API did not return JSON metadata");
  }

  const adminResponse = await fetchWithoutRedirect(
    fetchImpl,
    siteUrl,
    "/wp-admin/",
  );
  if (adminResponse.status < 200 || adminResponse.status >= 400) {
    throw new Error(`WordPress admin returned HTTP ${adminResponse.status}`);
  }
  return {
    root: rootResponse.status,
    legacy: legacyResponse.status,
    api: apiResponse.status,
    admin: adminResponse.status,
  };
}

async function verifyCutoverWithRetries(options) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await verifyCutoverLive(options);
    } catch (error) {
      lastError = error;
      if (attempt < 3)
        await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
  throw lastError;
}

export async function switchProduction(options) {
  const backupDirectory =
    options.backupDirectory ||
    (await findLatestBackup(options.documentsDirectory));
  if (!backupDirectory) throw new Error("No production backup was found");

  const report = await runPreflight({
    packageDirectory: options.packageDirectory,
    backupDirectory,
    live: true,
  });
  for (const check of report.checks) {
    console.log(
      `${check.level.toUpperCase().padEnd(5)} ${check.check}: ${check.message}`,
    );
  }
  if (!report.summary.ready) {
    throw new Error(
      `Production switch blocked by ${report.summary.block} preflight check(s)`,
    );
  }
  const liveRoot = report.checks.find((check) => check.check === "live-root");
  if (options.apply && !liveRoot?.oldWordPress) {
    throw new Error(
      "Production root is no longer the expected old WordPress site",
    );
  }

  const python =
    process.env.PYTHON?.trim() ||
    (process.platform === "win32" ? "python" : "python3");
  await run(python, [
    path.join(root, "scripts", "upload-wordpress-ftps.py"),
    "--source",
    path.join(backupDirectory, "wordpress-files"),
    "--manifest",
    path.join(backupDirectory, "wordpress-files-manifest.json"),
    "--verify-only",
  ]);

  const stagedSamples = await verifyRemoteSamples(options.packageDirectory);
  console.log(
    `Verified staged production samples: ${stagedSamples.join(", ")}`,
  );

  const rollback = path.join(backupDirectory, "wordpress-files", ".htaccess");
  const rules = path.join(
    options.packageDirectory,
    "server-config",
    "legacy-redirects.htaccess",
  );
  const [rollbackContent, rulesContent] = await Promise.all([
    readFile(rollback, "utf8"),
    readFile(rules, "utf8"),
  ]);
  const mergedContent = mergeHtaccess(rollbackContent, rulesContent);
  const temporary = await mkdtemp(path.join(os.tmpdir(), "snb-switch-"));
  const merged = path.join(temporary, "merged.htaccess");
  await writeFile(merged, mergedContent, { encoding: "utf8", flag: "wx" });

  const switchScript = path.join(
    root,
    "scripts",
    "switch-production-htaccess.py",
  );
  const baseArguments = [
    switchScript,
    "--rollback",
    rollback,
    "--merged",
    merged,
  ];
  if (options.host) baseArguments.push("--host", options.host);

  try {
    await run(python, [...baseArguments, "--verify-only"]);
    if (!options.apply) {
      return { report, backupDirectory, applied: false };
    }
    for (const name of ["SNB_FTPS_USER", "SNB_FTPS_PASSWORD"]) {
      if (!process.env[name]?.trim()) {
        throw new Error(`${name} is required for the production switch`);
      }
    }
    const environment = {
      ...process.env,
      SNB_PRODUCTION_DEPLOY_CONFIRM: productionDomain,
    };
    await run(python, [...baseArguments, "--apply"], environment);
    try {
      const checks = await verifyCutoverWithRetries();
      const samples = await verifyRemoteSamples(options.packageDirectory);
      console.log(
        `Production switch verified: root ${checks.root}, legacy ${checks.legacy}, API ${checks.api}, admin ${checks.admin}; samples ${samples.length}.`,
      );
      return { report, backupDirectory, applied: true, checks };
    } catch (verificationError) {
      console.error(
        `Cutover verification failed; restoring previous .htaccess: ${verificationError.message}`,
      );
      await run(python, [...baseArguments, "--restore"], environment);
      throw new Error(
        `Production switch was rolled back after failed verification: ${verificationError.message}`,
      );
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const outcome = await switchProduction(
      parseSwitchArguments(process.argv.slice(2)),
    );
    if (!outcome.applied) {
      console.log(
        `Production switch dry run passed using ${outcome.backupDirectory}. No network writes were made.`,
      );
    }
  } catch (error) {
    console.error(`Production switch failed: ${error.message}`);
    process.exitCode = 1;
  }
}
