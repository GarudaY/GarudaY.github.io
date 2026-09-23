import { request as httpsRequest } from "node:https";

const origin = new URL(process.env.KAS_WEB_URL ?? "https://kas.all-inkl.com/");
const username = process.env.KAS_LOGIN;
const password = process.env.KAS_PASSWORD;
const domain = process.env.KAS_SSL_DOMAIN;

if (origin.protocol !== "https:" || !username || !password || !domain) {
  throw new Error("KAS_LOGIN, KAS_PASSWORD, and KAS_SSL_DOMAIN are required");
}
if (!/^[a-z0-9.-]+$/i.test(domain)) throw new Error("Invalid SSL domain syntax");

const cookies = new Map();
async function request(url, { method = "GET", body } = {}) {
  const target = new URL(url, origin);
  if (target.protocol !== "https:" || target.origin !== origin.origin) {
    throw new Error("KAS web session attempted to leave its HTTPS origin");
  }
  return new Promise((resolve, reject) => {
    const headers = {
      Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join("; "),
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

const decodeHtml = (value) =>
  value
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&");

const follow = async (page) => {
  for (let redirects = 0; redirects < 5 && page.status >= 300 && page.status < 400 && page.location; redirects += 1) {
    page = await request(new URL(page.location, page.url));
  }
  return page;
};

let page = await request(new URL("login", origin));
const loginForm = page.body
  .split("<form")
  .slice(1)
  .map((segment) => `<form${segment.split("</form>")[0]}</form>`)
  .find((segment) => segment.includes('name="loginname"'));
if (!loginForm) throw new Error("KAS login form not found");
const loginFields = new URLSearchParams();
for (const match of loginForm.matchAll(/<input[^>]*>/g)) {
  const tag = match[0];
  const name = tag.match(/name="([^"]+)"/)?.[1];
  const type = tag.match(/type="([^"]+)"/)?.[1] ?? "text";
  if (!name || ["submit", "button", "reset"].includes(type)) continue;
  if (["checkbox", "radio"].includes(type) && !tag.includes("checked")) continue;
  loginFields.append(name, decodeHtml(tag.match(/value="([^"]*)"/)?.[1] ?? ""));
}
loginFields.set("loginname", username);
loginFields.set("passwort", password);
const loginAction = decodeHtml(loginForm.match(/action="([^"]+)"/)?.[1] ?? "login");
page = await follow(await request(new URL(loginAction, page.url), {
  method: "POST",
  body: loginFields.toString(),
}));
if (page.status !== 200 || page.url.pathname.includes("login")) throw new Error("KAS web login failed");

const sslHref = [...page.body.matchAll(/<a[^>]*href="([^"]+)"/gi)]
  .map((match) => decodeHtml(match[1]))
  .find((href) => href.includes("/ssl-protection/"));
if (!sslHref) throw new Error("KAS SSL overview link not found");
page = await follow(await request(new URL(sslHref, page.url)));

const template = page.body.match(/const SSLLetsEncrypt = '([^']+)'/)?.[1];
const dataJson = page.body.match(/const data = (\[[^;]+\]);/)?.[1];
if (!template || !dataJson) throw new Error("KAS SSL overview metadata not found");
const row = JSON.parse(dataJson).find((entry) => entry.domain === domain);
if (!row) throw new Error(`KAS SSL domain not found: ${domain}`);
if (row.has_ssl) {
  process.stdout.write(`${JSON.stringify({ domain, alreadyActive: true })}\n`);
  process.exit(0);
}
const letsEncryptUrl = template
  .replace("DOMAIN_NAME", encodeURIComponent(row.domain))
  .replace("SOURCE", encodeURIComponent(row.source));
page = await follow(await request(new URL(letsEncryptUrl, page.url)));

const form = page.body
  .split("<form")
  .slice(1)
  .map((segment) => `<form${segment.split("</form>")[0]}</form>`)
  .find((segment) => segment.includes('name="le_disclaimer"'));
if (!form) throw new Error("KAS Let's Encrypt request form not found");
const fields = new URLSearchParams();
for (const match of form.matchAll(/<input[^>]*>/g)) {
  const tag = match[0];
  const name = tag.match(/name="([^"]+)"/)?.[1];
  const type = tag.match(/type="([^"]+)"/)?.[1] ?? "text";
  if (!name || ["submit", "button", "reset"].includes(type)) continue;
  if (["checkbox", "radio"].includes(type) && name !== "le_disclaimer" && !tag.includes("checked")) continue;
  fields.append(name, decodeHtml(tag.match(/value="([^"]*)"/)?.[1] ?? "on"));
}
fields.set("domain", domain);
fields.set("source", row.source);
if (!fields.has("le_disclaimer")) fields.set("le_disclaimer", "on");
const action = decodeHtml(form.match(/action="([^"]+)"/)?.[1] ?? "");
if (!action || !fields.get("csrf_token")) throw new Error("KAS Let's Encrypt form metadata missing");
page = await follow(await request(new URL(action, page.url), {
  method: "POST",
  body: fields.toString(),
}));

const text = page.body.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const messages = [...page.body.matchAll(/<(?:div|p)[^>]*class="[^"]*(?:alert|notification|toast)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|p)>/gi)]
  .map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500))
  .filter(Boolean)
  .slice(0, 10);
const accepted =
  /in progress|processing|being created|successfully|wird erstellt|bearbeitung|erfolgreich/i.test(`${text} ${messages.join(" ")}`) ||
  page.url.pathname.includes("overview");
if (page.status !== 200 || !accepted) {
  throw new Error(`KAS did not confirm the Let's Encrypt request (HTTP ${page.status}, path ${page.url.pathname}, messages ${JSON.stringify(messages)})`);
}
process.stdout.write(`${JSON.stringify({ domain, requested: true, path: page.url.pathname, messages })}\n`);
