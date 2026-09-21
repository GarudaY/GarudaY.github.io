import { spawn } from "node:child_process";
import { resolve } from "node:path";

const child = spawn(
  process.execPath,
  [resolve("node_modules/next/dist/bin/next"), "dev"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      WORDPRESS_CMS_URL:
        process.env.WORDPRESS_CMS_URL || "http://127.0.0.1:9400",
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
