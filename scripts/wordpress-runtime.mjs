import { runCLI } from "@wp-playground/cli";
import { resolve } from "node:path";
import { Server } from "node:http";

export async function startWordPress({ persistent = false, port = 9400 } = {}) {
  const plugin = resolve("cms/wordpress/sonnenblume-content");
  // The upstream CLI currently has no host option and calls listen(port).
  // Scope the override to initialization so even its boot-time listener is loopback-only.
  const listen = Server.prototype.listen;
  Server.prototype.listen = function (...args) {
    if (
      typeof args[0] === "number" &&
      (args[1] === undefined || typeof args[1] === "function")
    )
      args.splice(1, 0, "127.0.0.1");
    return Reflect.apply(listen, this, args);
  };
  let server;
  try {
    server = await runCLI({
      command: persistent ? "start" : "server",
      path: plugin,
      ...(persistent
        ? { autoMount: true, skipBrowser: true }
        : {
            mount: [
              {
                hostPath: plugin,
                vfsPath: "/wordpress/wp-content/plugins/sonnenblume-content",
              },
            ],
          }),
      port,
      "site-url": `http://127.0.0.1:${port}`,
      php: "8.2",
      wp: "7.1",
      workers: 2,
      login: false,
      internalCookieStore: false,
      verbosity: "quiet",
      blueprint: {
        steps: [
          {
            step: "activatePlugin",
            pluginPath: "sonnenblume-content/sonnenblume-content.php",
          },
        ],
      },
    });
  } finally {
    Server.prototype.listen = listen;
  }
  if (server.server.address()?.address !== "127.0.0.1") {
    await server[Symbol.asyncDispose]();
    throw new Error(
      "Refusing to expose the local WordPress editor outside loopback",
    );
  }
  return server;
}
