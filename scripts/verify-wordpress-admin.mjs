import { request as httpsRequest } from "node:https";

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

const cookies = new Map();
const basic = Buffer.from(`${httpUser}:${httpPassword}`, "utf8").toString("base64");
async function request(url, { method = "GET", body } = {}) {
  const target = new URL(url, base);
  if (target.protocol !== "https:" || target.origin !== base.origin) {
    throw new Error("WordPress redirected outside its HTTPS origin");
  }
  return new Promise((resolve, reject) => {
    const headers = {
      Authorization: `Basic ${basic}`,
      Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join("; "),
      "User-Agent": "SONNENBLUME staging verifier",
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      headers["Content-Length"] = Buffer.byteLength(body);
    }
    const client = httpsRequest(target, { method, headers }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        for (const cookie of response.headers["set-cookie"] ?? []) {
          const pair = cookie.split(";", 1)[0];
          const separator = pair.indexOf("=");
          cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
        }
        resolve({
          status: response.statusCode,
          location: response.headers.location,
          body: Buffer.concat(chunks).toString("utf8"),
          url: target,
        });
      });
    });
    client.on("error", reject);
    client.end(body);
  });
}

const editorUrl = new URL("wp-admin/admin.php?page=sonnenblume-content", base);
await request(new URL("wp-login.php", base));
const loginBody = new URLSearchParams({
  log: wordpressUser,
  pwd: wordpressPassword,
  "wp-submit": "Log In",
  redirect_to: editorUrl.toString(),
  testcookie: "1",
}).toString();
let page = await request(new URL("wp-login.php", base), { method: "POST", body: loginBody });
for (let redirects = 0; redirects < 5 && page.status >= 300 && page.status < 400 && page.location; redirects += 1) {
  page = await request(new URL(page.location, page.url));
}
if (page.body.includes('class="admin-email-confirm-form"')) {
  const remindLink = page.body.match(/href="([^"]*remind_me_later=[^"]+)"/i)?.[1]
    ?.replaceAll("&amp;", "&");
  if (!remindLink) throw new Error("WordPress admin email reminder link missing");
  page = await request(new URL(remindLink, page.url));
  for (let redirects = 0; redirects < 5 && page.status >= 300 && page.status < 400 && page.location; redirects += 1) {
    page = await request(new URL(page.location, page.url));
  }
}
if (page.url.pathname.includes("wp-login.php") || page.body.includes('id="loginform"')) {
  const reason = page.body
    .match(/<(?:div|p)[^>]*(?:id="login_error"|class="wp-die-message")[^>]*>([\s\S]*?)<\/(?:div|p)>/i)?.[1]
    ?.replace(/<[^>]+>/g, " ")
    .replaceAll(wordpressUser, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
  process.stdout.write(`${JSON.stringify({
    authenticated: false,
    contentEditorVisible: false,
    status: page.status,
    path: page.url.pathname,
    title: page.body.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim(),
    reason,
  })}\n`);
  process.exit(2);
}
if (!page.url.pathname.includes("wp-admin")) page = await request(editorUrl);
const authenticated = !page.url.pathname.includes("wp-login.php") && !page.body.includes('id="loginform"');
const contentEditorVisible = authenticated && page.body.includes('id="snb-app"');
const operationsPage = authenticated
  ? await request(new URL("wp-admin/admin.php?page=sonnenblume-operations", base))
  : null;
const operationsVisible = Boolean(
  operationsPage?.status === 200 &&
    operationsPage.body.includes("Заявки SONNENBLUME"),
);
process.stdout.write(`${JSON.stringify({
  authenticated,
  contentEditorVisible,
  operationsVisible,
  status: page.status,
  path: page.url.pathname,
})}\n`);
if (!authenticated || !contentEditorVisible || !operationsVisible) process.exit(3);
