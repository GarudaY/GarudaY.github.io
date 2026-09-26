import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  renderApacheLegacyRedirects,
  renderLegacyRedirectHtml,
  validateLegacyRedirectConfiguration,
  verifyLegacyRedirectTargets,
} from "./legacy-redirects.mjs";

function targetFile(outputDirectory, target) {
  const url = new URL(target, "https://sonnenblume.invalid");
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  return url.pathname.endsWith("/")
    ? path.join(outputDirectory, relative, "index.html")
    : path.join(outputDirectory, relative);
}

test("every indexed legacy URL has one documented redirect", async () => {
  const configuration = await validateLegacyRedirectConfiguration();
  assert.equal(configuration.sitemapPaths.length, 45);
  assert.equal(configuration.redirects.length, 45);
  assert.equal(
    new Set(configuration.redirects.map((entry) => entry.source)).size,
    45,
  );
});

test("Apache migration block uses exact rules and keeps Unicode slugs", async () => {
  const configuration = await validateLegacyRedirectConfiguration();
  const apache = renderApacheLegacyRedirects(configuration.redirects);
  assert.match(apache, /RewriteRule \^\$ \/de\/ \[R=301,L,NE\]/);
  assert.match(apache, /RewriteRule \^2025\/05\/23\/зустріч/);
  assert.match(apache, /Place this block before WordPress rules/);
  assert.equal((apache.match(/^RewriteRule /gm) ?? []).length, 45);
});

test("redirect page uses an absolute canonical and escapes attributes", () => {
  const html = renderLegacyRedirectHtml({
    target: "/de/#board",
    locale: "de",
    siteUrl: "https://sonnenblume-mg.com",
  });
  assert.match(html, /http-equiv="refresh" content="0;url=\/de\/#board"/);
  assert.match(html, /href="https:\/\/sonnenblume-mg\.com\/de\/#board"/);
});

test("all redirect targets and fragments must exist in the export", async () => {
  const fixture = await mkdtemp(
    path.join(os.tmpdir(), "ukr-legacy-redirects-"),
  );
  try {
    const configuration = await validateLegacyRedirectConfiguration();
    const targets = new Map();
    for (const entry of configuration.redirects) {
      const url = new URL(entry.target, "https://sonnenblume.invalid");
      const file = targetFile(fixture, entry.target);
      const state = targets.get(file) ?? {
        anchors: new Set(),
        html: file.endsWith(".html"),
      };
      if (url.hash) state.anchors.add(decodeURIComponent(url.hash.slice(1)));
      targets.set(file, state);
    }

    for (const [file, state] of targets) {
      await mkdir(path.dirname(file), { recursive: true });
      const content = state.html
        ? [...state.anchors]
            .map((id) => `<section id="${id}"></section>`)
            .join("") || "<main></main>"
        : "document";
      await writeFile(file, content);
    }

    assert.equal(await verifyLegacyRedirectTargets(fixture), 45);

    const missing = targetFile(fixture, "/de/contact/");
    await unlink(missing);
    await assert.rejects(
      verifyLegacyRedirectTargets(fixture),
      /points to missing export target \/de\/contact\//,
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
