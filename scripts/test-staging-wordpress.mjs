import assert from "node:assert/strict";

const base = new URL(process.env.SNB_WP_URL ?? "");
const httpUser = process.env.SNB_HTTP_USER;
const httpPassword = process.env.SNB_HTTP_PASSWORD;
const wordpressUser = process.env.SNB_WP_USER;
const wordpressPassword = process.env.SNB_WP_PASSWORD;

if (
  base.protocol !== "https:" ||
  !httpUser ||
  !httpPassword ||
  !wordpressUser ||
  !wordpressPassword
) {
  throw new Error("Set HTTPS SNB_WP_URL and all SNB_HTTP_*/SNB_WP_* variables");
}

const basic = Buffer.from(`${httpUser}:${httpPassword}`, "utf8").toString("base64");
const cookies = new Map();
const collect = (response) => {
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";", 1)[0];
    const separator = pair.indexOf("=");
    cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
};
const cookieHeader = () => [...cookies].map(([key, value]) => `${key}=${value}`).join("; ");
const request = async (url, options = {}) => {
  const target = new URL(url, base);
  if (target.protocol !== "https:" || target.origin !== base.origin) {
    throw new Error("Staging request attempted to leave its HTTPS origin");
  }
  const response = await fetch(target, {
    ...options,
    headers: {
      Authorization: `Basic ${basic}`,
      Cookie: cookieHeader(),
      ...options.headers,
    },
    redirect: options.redirect ?? "manual",
    signal: AbortSignal.timeout(45_000),
  });
  collect(response);
  return response;
};

await request("wp-login.php");
const login = await request("wp-login.php", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    log: wordpressUser,
    pwd: wordpressPassword,
    "wp-submit": "Log In",
    redirect_to: new URL("wp-admin/admin.php?page=sonnenblume-content", base).toString(),
    testcookie: "1",
  }),
});
assert.equal(login.status, 302, `Staging WordPress login returned HTTP ${login.status}`);

const admin = await request("wp-admin/admin.php?page=sonnenblume-content", { redirect: "follow" });
assert.equal(admin.status, 200);
const html = await admin.text();
const rawConfig = html.match(/window\.SNB_CONTENT\s*=\s*(\{[^\n]+\});/);
assert.ok(rawConfig, "Admin page is missing authenticated REST configuration");
const config = JSON.parse(rawConfig[1]);
assert.equal(config.collection, "updates");
assert.ok(config.nonce);

const adminPages = new Map([
  ["sonnenblume-people", "people"],
  ["sonnenblume-courses", "courses"],
  ["sonnenblume-events", "events"],
  ["sonnenblume-volunteer", "volunteer"],
  ["sonnenblume-partners", "partners"],
]);
for (const [page, collection] of adminPages) {
  const response = await request(`wp-admin/admin.php?page=${page}`, { redirect: "follow" });
  assert.equal(response.status, 200);
  const pageHtml = await response.text();
  assert.ok(pageHtml.includes('id="snb-app"'), `${collection} editor root is missing`);
  const raw = pageHtml.match(/window\.SNB_CONTENT\s*=\s*(\{[^\n]+\});/);
  assert.ok(raw, `${collection} editor configuration is missing`);
  assert.equal(JSON.parse(raw[1]).collection, collection);
}

let item;
const marker = `STAGING-CMS-ROUNDTRIP-${Date.now()}`;
const data = {
  title: { uk: marker, de: marker + "-DE" },
  status: { uk: "Перевірка", de: "Prüfung" },
  text: {
    uk: "Технічна перевірка staging; запис буде одразу архівовано.",
    de: "Technische Staging-Prüfung; der Eintrag wird sofort archiviert.",
  },
  icon: "users",
  order: 999,
  imageId: 0,
  imageAlt: { uk: "", de: "" },
  imageFocus: 50,
  isExample: true,
};

const write = async (action) => {
  const suffix = item ? `/${item.id}` : "";
  const response = await request(`wp-json/sonnenblume/v1/updates${suffix}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WP-Nonce": config.nonce,
    },
    body: JSON.stringify({ action, revision: item?.revision, data }),
    redirect: "follow",
  });
  const result = await response.json();
  assert.ok(response.ok, JSON.stringify(result));
  item = result;
};

const publicItems = async () => {
  const response = await request("wp-json/sonnenblume/v1/updates/public", { redirect: "follow" });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.schemaVersion, 1);
  return result.items;
};

try {
  await write("save");
  assert.ok(!(await publicItems()).some((entry) => entry.title?.uk === marker));
  await write("publish");
  assert.ok((await publicItems()).some((entry) => entry.title?.uk === marker));
  await write("archive");
  assert.ok(!(await publicItems()).some((entry) => entry.title?.uk === marker));
} finally {
  if (item && !item.archived) {
    try {
      await write("archive");
    } catch {
      // Preserve the original assertion error; the record stays staging-only.
    }
  }
}

process.stdout.write(`${JSON.stringify({
  login: true,
  editor: true,
  editorSections: 6,
  draftHidden: true,
  publishVisible: true,
  archiveHidden: true,
})}\n`);
