import assert from "node:assert/strict";
import test from "node:test";
import {
  parseSwitchArguments,
  verifyCutoverLive,
} from "./switch-production.mjs";

test("production switch is dry-run by default and apply needs exact confirmation", () => {
  assert.equal(parseSwitchArguments([]).apply, false);
  assert.throws(
    () => parseSwitchArguments(["--apply"]),
    /--confirm sonnenblume-mg\.com/,
  );
  assert.equal(
    parseSwitchArguments(["--apply", "--confirm", "sonnenblume-mg.com"]).apply,
    true,
  );
});

test("production switch verification requires redirects and WordPress access", async () => {
  const fetchImpl = async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/")
      return new Response(null, {
        status: 301,
        headers: { location: "/de/" },
      });
    if (pathname === "/spenden/")
      return new Response(null, {
        status: 301,
        headers: { location: "/de/donate/" },
      });
    if (pathname === "/wp-json/") return Response.json({ name: "WordPress" });
    if (pathname === "/wp-admin/")
      return new Response(null, {
        status: 302,
        headers: { location: "/login" },
      });
    return new Response(null, { status: 404 });
  };
  assert.deepEqual(await verifyCutoverLive({ fetchImpl }), {
    root: 301,
    legacy: 301,
    api: 200,
    admin: 302,
  });
});

test("production switch verification rejects an unswitched root", async () => {
  const fetchImpl = async () => new Response("old WordPress", { status: 200 });
  await assert.rejects(verifyCutoverLive({ fetchImpl }), /did not redirect/);
});
