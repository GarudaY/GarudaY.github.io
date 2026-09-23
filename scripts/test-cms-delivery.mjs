import assert from "node:assert/strict";
import { createServer } from "node:https";
import { execFile, spawn } from "node:child_process";
import { readFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { resolve, join, relative, isAbsolute } from "node:path";
import { promisify } from "node:util";
import { localCmsClient, cms, fetchLocal } from "./cms-local-test-client.mjs";

// Read-only HTTPS bridge, with an ephemeral locally trusted certificate. No insecure TLS flags.
// Tests runtime CMS settings after build and a real CMS-configured static export.
const root = resolve(".");
const generated = join(root, ".cms-build");
await mkdir(generated, { recursive: true });
const temp = await mkdtemp(join(generated, "delivery-test-"));
const safe = relative(generated, temp);
assert.ok(safe && !safe.startsWith("..") && !isAbsolute(safe));
const cert = join(temp, "cert.pem");
const key = join(temp, "key.pem");
const openssl =
  process.platform === "win32"
    ? "C:/Program Files/Git/usr/bin/openssl.exe"
    : "openssl";
let bridge;
let child;
let item;
let eventItem;
let partnerItem;
let output = "";
const client = await localCmsClient("people");
const eventClient = await localCmsClient("events");
const partnerClient = await localCmsClient("partners");
const eventImageId = (await eventClient.api()).items.find((entry) => entry.data.imageId)?.data.imageId;
assert.ok(eventImageId, "An imported event image is required for delivery testing");
const marker = `CMS-DELIVERY-${Date.now()}`;
const data = {
  slug: marker.toLowerCase(),
  name: { uk: marker, de: marker + "-DE" },
  roleLabel: { uk: "Локальний тест", de: "Lokaler Test" },
  bio: { uk: "Локальна перевірка доставки", de: "Lokaler Auslieferungstest" },
  teacherRoleLabel: { uk: "", de: "" },
  teacherBio: { uk: "", de: "" },
  roles: ["volunteer"],
  boardPosition: null,
  languages: [],
  order: 0,
  imageId: 0,
  imageAlt: { uk: "", de: "" },
  imageFocus: 50,
  publicationPermission: true,
};
const eventData = {
  slug: `event-${marker.toLowerCase()}`,
  title: { uk: `Подія ${marker}`, de: `Veranstaltung ${marker}` },
  summary: { uk: "Локальна перевірка доставки подій.", de: "Lokaler Auslieferungstest für Veranstaltungen." },
  description: { uk: "Тільки технічна перевірка.", de: "Nur ein technischer Test." },
  dateLabel: { uk: "", de: "" },
  timeLabel: { uk: "", de: "" },
  location: { uk: "Mönchengladbach", de: "Mönchengladbach" },
  price: { uk: "Безкоштовно", de: "Kostenfrei" },
  registrationLabel: { uk: "Дізнатися більше", de: "Mehr erfahren" },
  category: "community",
  eventStatus: "upcoming",
  capacity: 0,
  seatsAvailable: 0,
  archiveType: "",
  organizerName: "",
  startsAt: "2026-10-18T15:00:00+02:00",
  endsAt: "2026-10-18T17:00:00+02:00",
  contactEmail: "kontakt@sonnenblume-mg.com",
  relatedCourseIds: [],
  gallery: [],
  imageId: eventImageId,
  imageAlt: { uk: "Фото події", de: "Veranstaltungsfoto" },
  imageFocus: 50,
  isFeatured: false,
  order: 99,
};
const partnerData = {
  slug: `partner-${marker.toLowerCase()}`, kind: "person", name: `Partner ${marker}`,
  description: { uk: "Допомога команді.", de: "Unterstützung für das Team." },
  website: "", order: 99, imageId: 0, imageAlt: { uk: "", de: "" },
  imageFocus: 50, publicationPermission: true,
};
const run = (args, env) =>
  new Promise((done, reject) => {
    const process = spawn(globalThis.process.execPath, args, {
      cwd: root,
      env,
      stdio: "inherit",
      shell: false,
    });
    process.once("error", reject);
    process.once("exit", (code) =>
      code === 0 ? done() : reject(new Error(`Build exited ${code}`)),
    );
  });
try {
  await promisify(execFile)(
    openssl,
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      key,
      "-out",
      cert,
      "-days",
      "1",
      "-subj",
      "/CN=localhost",
      "-addext",
      "subjectAltName=DNS:localhost,IP:127.0.0.1",
    ],
    { windowsHide: true },
  );
  const origin = "https://127.0.0.1:9443";
  const prefix = `/${marker.toLowerCase()}`;
  const cmsBase = origin + prefix;
  bridge = createServer(
    { key: await readFile(key), cert: await readFile(cert) },
    async (req, res) => {
      try {
        const source = new URL(req.url, cms);
        if (!source.pathname.startsWith(prefix + "/")) {
          res.writeHead(403);
          res.end();
          return;
        }
        source.pathname = source.pathname.slice(prefix.length);
        const feed =
          source.pathname === "/" &&
          /^\/sonnenblume\/v1\/(people|updates|courses|events|volunteer|partners)\/public$/.test(
            source.searchParams.get("rest_route") || "",
          );
        if (
          req.method !== "GET" ||
          (!feed && !source.pathname.startsWith("/wp-content/uploads/"))
        ) {
          res.writeHead(403);
          res.end();
          return;
        }
        const result = await fetchLocal(source, { redirect: "error" });
        let bytes = Buffer.from(await result.arrayBuffer());
        if (feed)
          bytes = Buffer.from(
            JSON.stringify(JSON.parse(bytes.toString("utf8"))).replaceAll(
              cms,
              cmsBase,
            ),
          );
        res.writeHead(result.status, {
          "Content-Type":
            result.headers.get("content-type") || "application/octet-stream",
          "Content-Length": bytes.length,
        });
        res.end(bytes);
      } catch {
        res.writeHead(502);
        res.end();
      }
    },
  );
  await new Promise((done, reject) => {
    bridge.once("error", reject);
    bridge.listen(9443, "127.0.0.1", done);
  });
  item = await client.api("", { action: "publish", data });
  eventItem = await eventClient.api("", { action: "publish", data: eventData });
  partnerItem = await partnerClient.api("", { action: "publish", data: partnerData });
  const env = {
    ...process.env,
    NODE_ENV: "production",
    WORDPRESS_CMS_URL: cmsBase,
    NODE_EXTRA_CA_CERTS: cert,
  };
  delete env.GITHUB_PAGES_EXPORT;
  child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--port",
      "3002",
      "--hostname",
      "127.0.0.1",
    ],
    { cwd: root, env, shell: false, stdio: ["ignore", "pipe", "pipe"] },
  );
  child.stdout.on("data", (value) => {
    output += value;
  });
  child.stderr.on("data", (value) => {
    output += value;
  });
  child.on("error", (error) => {
    output += error.message;
  });
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (child.exitCode !== null) throw new Error(output);
    try {
      const response = await fetch("http://127.0.0.1:3002/robots.txt", {
        signal: AbortSignal.timeout(1000),
      });
      if (response.status < 500) {
        ready = true;
        break;
      }
    } catch {
      /* starting */
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  assert.ok(ready, output);
  for (const locale of ["uk", "de"]) {
    for (const path of [`/${locale}`, `/${locale}/people/${data.slug}`]) {
      const response = await fetchLocal(`http://127.0.0.1:3002${path}`);
      assert.equal(response.status, 200, `${path}\n${output.slice(-6000)}`);
      assert.ok(
        (await response.text()).includes(data.name[locale]),
        `Runtime CMS profile absent: ${path}`,
      );
    }
    const eventPath = `/${locale}/events/${eventData.slug}`;
    const eventResponse = await fetchLocal(`http://127.0.0.1:3002${eventPath}`);
    assert.equal(eventResponse.status, 200, `${eventPath}\n${output.slice(-6000)}`);
    assert.ok((await eventResponse.text()).includes(eventData.title[locale]));
    const volunteerResponse = await fetchLocal(`http://127.0.0.1:3002/${locale}/join`);
    assert.equal(volunteerResponse.status, 200, output.slice(-6000));
    assert.ok(
      (await volunteerResponse.text()).includes(
        locale === "uk" ? "Допомога на подіях" : "Mithilfe bei Veranstaltungen",
      ),
    );
    const home = await fetchLocal(`http://127.0.0.1:3002/${locale}`);
    assert.ok((await home.text()).includes(partnerData.name));
  }
  console.log(
    "PASS: production Next.js accepts HTTPS CMS supplied after build and renders new profile and event URLs",
  );
  const navigation = await fetchLocal(
    `http://127.0.0.1:3002/de/menschen/${data.slug}`,
    { headers: { rsc: "1" } },
  );
  assert.equal(navigation.status, 200, output.slice(-6000));
  assert.match(navigation.headers.get("content-type"), /text\/x-component/);
  assert.ok((await navigation.text()).includes(data.name.de));
  console.log(
    "PASS: production German localized URL also serves client-navigation RSC without a redirect loop",
  );
  const sitemap = await fetchLocal("http://127.0.0.1:3002/sitemap.xml");
  assert.equal(sitemap.status, 200);
  const sitemapText = await sitemap.text();
  assert.ok(sitemapText.includes(data.slug));
  assert.ok(sitemapText.includes(eventData.slug));
  console.log("PASS: production sitemap includes newly published CMS profile and event");
  await run(["scripts/build-github-pages.mjs"], env);
  for (const locale of ["uk", "de"]) {
    const file = await readFile(
      join(root, ".pages-out", locale, "people", data.slug, "index.html"),
      "utf8",
    );
    assert.ok(file.includes(data.name[locale]));
    const eventFile = await readFile(
      join(root, ".pages-out", locale, "events", eventData.slug, "index.html"),
      "utf8",
    );
    assert.ok(eventFile.includes(eventData.title[locale]));
    const volunteerFile = await readFile(
      join(root, ".pages-out", locale, "join", "index.html"),
      "utf8",
    );
    assert.ok(
      volunteerFile.includes(
        locale === "uk" ? "Допомога на подіях" : "Mithilfe bei Veranstaltungen",
      ),
    );
    const homeFile = await readFile(join(root, ".pages-out", locale, "index.html"), "utf8");
    assert.ok(homeFile.includes(partnerData.name));
  }
  console.log(
    "PASS: HTTPS CMS static export generates both detail pages for a new profile and event",
  );
  console.log(
    "Delivery test output is local-only. Regenerate Pages with the intended real CMS configuration before deployment.",
  );
} finally {
  if (partnerItem && !partnerItem.archived)
    await partnerClient.api(`/${partnerItem.id}`, {
      action: "archive", revision: partnerItem.revision,
    });
  if (eventItem && !eventItem.archived)
    await eventClient.api(`/${eventItem.id}`, {
      action: "archive",
      revision: eventItem.revision,
    });
  if (item && !item.archived)
    await client.api(`/${item.id}`, {
      action: "archive",
      revision: item.revision,
    });
  if (child && child.exitCode === null) {
    const ended = new Promise((done) => child.once("exit", done));
    child.kill("SIGTERM");
    await ended;
  }
  if (bridge) {
    bridge.closeAllConnections();
    await new Promise((done) => bridge.close(done));
  }
  assert.ok(relative(generated, temp) === safe);
  await rm(temp, { recursive: true, force: true });
}
