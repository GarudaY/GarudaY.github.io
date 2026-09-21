import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import { NextRequest, NextResponse } from "next/server.js";

async function load(path, imports) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    module: { exports },
    require: (name) => {
      if (!(name in imports))
        throw new Error(`Unexpected test import: ${name}`);
      return imports[name];
    },
    URL,
    process,
  });
  return exports;
}
const config = await load("../src/i18n/config.ts", {});
const routing = await load("../src/i18n/routing.ts", {
  "@/config/site": { siteConfig: { baseUrl: "https://example.org" } },
});
const { middleware } = await load("../src/middleware.ts", {
  "next/server": { NextResponse },
  "@/i18n/config": config,
  "@/i18n/routing": routing,
});

test("localized internal rewrites preserve router origin and cannot self-proxy loopback", () => {
  const previous = process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE;
  process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE = "true";
  try {
    for (const host of ["127.0.0.1:3002", "localhost:3002", "example.org"]) {
      const base = `http://${host}`;
      for (const [internal, publicSegment] of Object.entries(
        routing.internalToPublicSegment.de,
      )) {
        if (internal === publicSegment) continue;
        const request = new NextRequest(
          `${base}/de/${publicSegment}/fixture?topic=course-general`,
        );
        const response = middleware(request);
        const destination = new URL(
          response.headers.get("x-middleware-rewrite"),
        );
        assert.equal(destination.origin, base);
        assert.equal(destination.pathname, `/de/${internal}/fixture`);
        assert.equal(destination.searchParams.get("topic"), "course-general");
        assert.equal(response.headers.get("location"), null);
      }
    }
  } finally {
    if (previous === undefined)
      delete process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE;
    else process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE = previous;
  }
});
test("internal German aliases redirect once to public names; files and API remain untouched", () => {
  const response = middleware(
    new NextRequest("https://example.org/de/people/fixture"),
  );
  assert.equal(response.status, 307);
  assert.equal(
    new URL(response.headers.get("location")).pathname,
    "/de/menschen/fixture",
  );
  for (const path of [
    "/api/contact",
    "/_next/static/a.js",
    "/images/portrait.webp",
  ]) {
    const result = middleware(new NextRequest(`https://example.org${path}`));
    assert.equal(result.headers.get("x-middleware-next"), "1");
    assert.equal(result.headers.get("location"), null);
  }
});
