import { cp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workDirectory = path.join(root, ".pages-work");
const outputDirectory = path.join(root, ".pages-out");

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
  "next-env.d.ts",
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
  path.join(workDirectory, "src", "app", "[locale]", "registration"),
  path.join(workDirectory, "src", "middleware.ts"),
]) {
  assertGeneratedPath(serverOnlyPath);
  await rm(serverOnlyPath, { recursive: true, force: true });
}

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
      NEXT_PUBLIC_SITE_URL: "https://garuday.github.io",
      NEXT_PUBLIC_API_BASE_URL:
        "https://ukrainian-verein-demo.daskevich1122.chatgpt.site",
    },
  },
);

await cp(path.join(workDirectory, "out"), outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, ".nojekyll"), "", "utf8");

console.log(`GitHub Pages export ready: ${outputDirectory}`);
