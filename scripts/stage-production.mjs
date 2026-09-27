import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  findLatestBackup,
  runPreflight,
} from "./verify-production-cutover.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const productionDomain = "sonnenblume-mg.com";

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

export function parseStageArguments(args) {
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
    else if (argument === "--remote-root") options.remoteRoot = args[++index];
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (options.apply && options.confirm !== productionDomain) {
    throw new Error(
      `Production staging requires --confirm ${productionDomain}`,
    );
  }
  return options;
}

export async function stageProduction(options) {
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
      `Production staging blocked by ${report.summary.block} preflight check(s)`,
    );
  }

  const python =
    process.env.PYTHON?.trim() ||
    (process.platform === "win32" ? "python" : "python3");
  const backupManifest = path.join(
    backupDirectory,
    "wordpress-files-manifest.json",
  );
  await run(python, [
    path.join(root, "scripts", "upload-wordpress-ftps.py"),
    "--source",
    path.join(backupDirectory, "wordpress-files"),
    "--manifest",
    backupManifest,
    "--verify-only",
  ]);

  const uploaderArguments = [
    path.join(root, "scripts", "stage-production-ftps.py"),
    "--package",
    options.packageDirectory,
    options.apply ? "--apply" : "--verify-only",
  ];
  if (options.host) uploaderArguments.push("--host", options.host);
  if (options.remoteRoot)
    uploaderArguments.push("--remote-root", options.remoteRoot);

  if (options.apply) {
    for (const name of ["SNB_FTPS_USER", "SNB_FTPS_PASSWORD"]) {
      if (!process.env[name]?.trim()) {
        throw new Error(`${name} is required for production staging`);
      }
    }
  }
  await run(
    python,
    uploaderArguments,
    options.apply
      ? { ...process.env, SNB_PRODUCTION_DEPLOY_CONFIRM: productionDomain }
      : process.env,
  );
  return { report, backupDirectory, applied: options.apply };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const outcome = await stageProduction(
      parseStageArguments(process.argv.slice(2)),
    );
    if (!outcome.applied) {
      console.log(
        `Dry run passed using ${outcome.backupDirectory}. No network writes were made.`,
      );
    }
  } catch (error) {
    console.error(`Production staging failed: ${error.message}`);
    process.exitCode = 1;
  }
}
