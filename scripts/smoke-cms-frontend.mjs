import assert from "node:assert/strict";

// Local-only round trip against the actual editor backend and Next.js page.
// Playground's isolated install has its standard admin/password account.
const cms = "http://127.0.0.1:9400";
const frontend = "http://localhost:3000";
const cookies = new Map();
function collect(response) {
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";")[0];
    const index = pair.indexOf("=");
    cookies.set(pair.slice(0, index), pair.slice(index + 1));
  }
}
const cookieHeader = () =>
  [...cookies].map(([key, value]) => `${key}=${value}`).join("; ");
const fetchLocal = (url, options = {}) =>
  fetch(url, { ...options, signal: AbortSignal.timeout(45000) });
collect(await fetchLocal(`${cms}/wp-login.php`));
const login = await fetchLocal(`${cms}/wp-login.php`, {
  method: "POST",
  headers: {
    Cookie: cookieHeader(),
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    log: "admin",
    pwd: "password",
    "wp-submit": "Log In",
    redirect_to: `${cms}/wp-admin/admin.php?page=sonnenblume-content`,
    testcookie: "1",
  }),
  redirect: "manual",
});
collect(login);
assert.equal(
  login.status,
  302,
  "Local Playground login failed (no production credentials are used)",
);
const admin = await fetchLocal(
  `${cms}/wp-admin/admin.php?page=sonnenblume-content`,
  { headers: { Cookie: cookieHeader() } },
);
assert.equal(admin.status, 200);
const html = await admin.text();
const rawConfig = html.match(/window\.SNB_CONTENT\s*=\s*(\{[^\n]+\});/);
assert.ok(
  rawConfig,
  "Admin page must contain its authenticated REST configuration",
);
const config = JSON.parse(rawConfig[1]);
let item;
const marker = `CMS-ROUNDTRIP-${Date.now()}`;
const data = {
  title: { uk: marker, de: marker + "-DE" },
  status: { uk: "Тест", de: "Test" },
  text: {
    uk: "Локальна перевірка публікації.",
    de: "Lokaler Veröffentlichungstest.",
  },
  icon: "users",
  order: 0,
  imageId: 0,
  imageAlt: { uk: "", de: "" },
  imageFocus: 50,
  isExample: true,
};
async function write(action, value = data) {
  const response = await fetchLocal(
    `${cms}/?rest_route=/sonnenblume/v1/updates${item ? "/" + item.id : ""}`,
    {
      method: "POST",
      headers: {
        Cookie: cookieHeader(),
        "X-WP-Nonce": config.nonce,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, revision: item?.revision, data: value }),
    },
  );
  const result = await response.json();
  assert.ok(response.ok, JSON.stringify(result));
  item = result;
}
const home = async (locale) => {
  const response = await fetchLocal(`${frontend}/${locale}`, {
    headers: { "cache-control": "no-cache" },
  });
  assert.equal(response.status, 200);
  return response.text();
};
try {
  await write("save");
  assert.ok(!(await home("uk")).includes(marker), "Draft must not be rendered");
  console.log("PASS: WordPress draft absent from actual Next.js home page");
  await write("publish");
  assert.ok((await home("uk")).includes(marker));
  assert.ok((await home("de")).includes(marker + "-DE"));
  console.log("PASS: publication rendered on Ukrainian and German home pages");
  const draft = structuredClone(data);
  draft.title.uk = "UNPUBLISHED-" + marker;
  await write("save", draft);
  const live = await home("uk");
  assert.ok(live.includes(marker) && !live.includes("UNPUBLISHED-" + marker));
  console.log("PASS: working changes do not replace published frontend text");
  await write("archive");
  assert.ok(!(await home("uk")).includes(marker));
  console.log("PASS: archive removed item from actual home page");
} finally {
  if (item && !item.archived) await write("archive");
  // Archive only this uniquely marked local test record, not editors' content.
  console.log(
    "Local CMS round trip complete; test item archived, history preserved.",
  );
}
