import { createHash } from "node:crypto";
import { constants } from "node:fs";
import {
  access,
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const gunzipAsync = promisify(gunzip);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredCredentials = [
  "SNB_FTPS_USER",
  "SNB_FTPS_PASSWORD",
  "SNB_PMA_URL",
  "SNB_DB_USER",
  "SNB_DB_PASSWORD",
  "SNB_DB_NAME",
];

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

export function findMissingCredentials(environment = process.env) {
  return requiredCredentials.filter((name) => !environment[name]?.trim());
}

export async function validateBackupDestination(
  destination,
  { projectRoot = root } = {},
) {
  const resolved = path.resolve(destination);
  const relative = path.relative(path.resolve(projectRoot), resolved);
  if (!relative || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    throw new Error("Backup destination must be outside the repository");
  }
  try {
    await access(resolved);
    throw new Error(`Backup destination already exists: ${resolved}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return resolved;
}

export async function validateBackupResumeDestination(
  destination,
  { projectRoot = root } = {},
) {
  const resolved = path.resolve(destination);
  const relative = path.relative(path.resolve(projectRoot), resolved);
  if (!relative || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    throw new Error("Backup destination must be outside the repository");
  }
  try {
    await access(path.join(resolved, "INCOMPLETE.txt"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(
        `Backup resume requires an incomplete backup marker: ${resolved}`,
      );
    }
    throw error;
  }
  return resolved;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: options.env ?? process.env,
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else {
        reject(
          new Error(
            `${command} exited with ${code ?? `signal ${signal ?? "unknown"}`}`,
          ),
        );
      }
    });
  });
}

export async function buildBackupSummary(destination, databasePath) {
  const manifestPath = path.join(destination, "wordpress-files-manifest.json");
  const rootConfigPath = path.join(destination, "wp-config.php");
  const [manifestContent, databaseContent, rootConfig] = await Promise.all([
    readFile(manifestPath),
    readFile(databasePath),
    readFile(rootConfigPath),
  ]);
  const manifest = JSON.parse(manifestContent.toString("utf8"));
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    throw new Error("Backup manifest is empty");
  }
  const rootConfigSha256 = sha256(rootConfig);
  const configEntry = manifest.files.find(
    (entry) =>
      entry.path.endsWith("wp-config.php") &&
      entry.sha256 === rootConfigSha256,
  );
  if (!configEntry) {
    throw new Error(
      "Root wp-config.php does not match the verified file backup",
    );
  }
  const sql = (await gunzipAsync(databaseContent)).toString("utf8");
  const tables = [...sql.matchAll(/CREATE TABLE\s+`([^`]+)`/g)].map(
    (match) => match[1],
  );
  if (
    tables.length < 10 ||
    !tables.some((table) => table.endsWith("options"))
  ) {
    throw new Error("Database backup failed the WordPress table sanity check");
  }
  const totalBytes = manifest.files.reduce((sum, entry) => sum + entry.size, 0);
  if (totalBytes !== manifest.total_bytes) {
    throw new Error("Backup manifest total does not match its entries");
  }
  return {
    schema: 1,
    completedAt: new Date().toISOString(),
    host: manifest.host,
    files: manifest.files.length,
    totalBytes,
    manifestSha256: sha256(manifestContent),
    database: path.basename(databasePath),
    databaseBytes: databaseContent.length,
    databaseSha256: sha256(databaseContent),
    databaseTables: tables.length,
    wpConfigSource: configEntry.path,
    wpConfigSha256: rootConfigSha256,
  };
}

function renderVerification(summary) {
  return [
    "# SONNENBLUME production backup verification",
    "",
    `Completed: ${summary.completedAt}`,
    "",
    `- WordPress files: ${summary.files}`,
    `- WordPress bytes: ${summary.totalBytes}`,
    `- Manifest SHA-256: \`${summary.manifestSha256}\``,
    `- Database: \`${summary.database}\``,
    `- Database tables: ${summary.databaseTables}`,
    `- Database SHA-256: \`${summary.databaseSha256}\``,
    `- wp-config.php source: \`${summary.wpConfigSource}\``,
    `- wp-config.php SHA-256: \`${summary.wpConfigSha256}\``,
    "",
    "Every WordPress file was re-read and verified against the manifest after download.",
    "The gzip database export contains the WordPress options table and passed its table-count sanity check.",
    "This directory is private rollback material and must not be uploaded to the public repository or webroot.",
    "",
  ].join("\n");
}

export async function backupProduction({
  destination,
  environment = process.env,
}) {
  const missing = findMissingCredentials(environment);
  if (missing.length > 0) {
    throw new Error(`Missing backup credentials: ${missing.join(", ")}`);
  }
  const resume = environment.SNB_BACKUP_RESUME?.trim() === "1";
  destination = resume
    ? await validateBackupResumeDestination(destination)
    : await validateBackupDestination(destination);
  if (!resume) await mkdir(destination);
  const incompleteMarker = path.join(destination, "INCOMPLETE.txt");
  if (!resume) {
    await writeFile(
      incompleteMarker,
      "Backup is incomplete until this marker is removed by the verified backup command.\n",
      "utf8",
    );
  }

  const python =
    environment.PYTHON?.trim() ||
    (process.platform === "win32" ? "python" : "python3");
  const filesDirectory = path.join(destination, "wordpress-files");
  const manifestPath = path.join(destination, "wordpress-files-manifest.json");
  const databasePath = path.join(
    destination,
    `database-${new Date().toISOString().slice(0, 10)}.sql.gz`,
  );
  const host = environment.SNB_FTPS_HOST?.trim() || "w01e41a4.kasserver.com";
  const wordpressRoot = environment.SNB_WORDPRESS_ROOT?.trim() || "";
  if (
    path.isAbsolute(wordpressRoot) ||
    path.relative(".", wordpressRoot).startsWith("..")
  ) {
    throw new Error("SNB_WORDPRESS_ROOT must be a relative server path");
  }
  const configSource = path.join(
    filesDirectory,
    wordpressRoot,
    "wp-config.php",
  );
  const reuseFiles = environment.SNB_BACKUP_REUSE_FILES?.trim() === "1";
  if (reuseFiles && !resume) {
    throw new Error("SNB_BACKUP_REUSE_FILES requires SNB_BACKUP_RESUME=1");
  }

  if (reuseFiles) {
    await Promise.all([access(filesDirectory), access(manifestPath)]);
  } else {
    await run(
      python,
      [
        path.join(root, "scripts", "backup-wordpress-ftps.py"),
        "--host",
        host,
        "--output",
        filesDirectory,
      ],
      { env: environment },
    );
  }
  await copyFile(
    configSource,
    path.join(destination, "wp-config.php"),
    resume ? 0 : constants.COPYFILE_EXCL,
  );
  await run(
    process.execPath,
    [path.join(root, "scripts", "backup-wordpress-db.mjs")],
    { env: { ...environment, SNB_DB_BACKUP_OUTPUT: databasePath } },
  );
  await run(
    python,
    [
      path.join(root, "scripts", "upload-wordpress-ftps.py"),
      "--source",
      filesDirectory,
      "--manifest",
      manifestPath,
      "--verify-only",
    ],
    { env: environment },
  );

  const summary = await buildBackupSummary(destination, databasePath);
  await writeFile(
    path.join(destination, "backup-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(destination, "BACKUP-VERIFICATION.md"),
    renderVerification(summary),
    "utf8",
  );
  await rm(incompleteMarker);
  return summary;
}

function parseArgs(args) {
  let destination = process.env.SNB_BACKUP_OUTPUT?.trim();
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--output") destination = args[++index];
    else throw new Error(`Unknown option: ${args[index]}`);
  }
  if (!destination) {
    throw new Error(
      "Set SNB_BACKUP_OUTPUT or pass --output <private-directory>",
    );
  }
  return { destination };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const summary = await backupProduction(parseArgs(process.argv.slice(2)));
  console.log(
    `Verified production backup: ${summary.files} files, ${summary.totalBytes} bytes, ${summary.databaseTables} database tables.`,
  );
}
