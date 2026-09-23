import { request as httpsRequest } from "node:https";
import { writeFileSync } from "node:fs";

const origin = new URL(process.env.KAS_WEB_URL ?? "https://kas.all-inkl.com/");
const username = process.env.KAS_LOGIN;
const password = process.env.KAS_PASSWORD;

if (origin.protocol !== "https:" || !username || !password) {
  throw new Error("KAS_LOGIN and KAS_PASSWORD are required");
}

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

let page = await request(new URL("login", origin));
const form = page.body
  .split("<form")
  .slice(1)
  .map((segment) => `<form${segment.split("</form>")[0]}</form>`)
  .find((segment) => segment.includes('name="loginname"'));
if (!form) throw new Error("KAS login form not found");

const fields = new URLSearchParams();
for (const match of form.matchAll(/<input[^>]*>/g)) {
  const tag = match[0];
  const name = tag.match(/name="([^"]+)"/)?.[1];
  const type = tag.match(/type="([^"]+)"/)?.[1] ?? "text";
  if (!name || ["submit", "button", "reset"].includes(type)) continue;
  if (["checkbox", "radio"].includes(type) && !tag.includes("checked")) continue;
  fields.append(name, decodeHtml(tag.match(/value="([^"]*)"/)?.[1] ?? ""));
}
fields.set("loginname", username);
fields.set("passwort", password);
const action = decodeHtml(form.match(/action="([^"]+)"/)?.[1] ?? "login");
page = await request(new URL(action, page.url), { method: "POST", body: fields.toString() });
for (let redirects = 0; redirects < 5 && page.status >= 300 && page.status < 400 && page.location; redirects += 1) {
  page = await request(new URL(page.location, page.url));
}
if (page.status !== 200 || page.url.pathname.includes("login")) {
  throw new Error(`KAS web login failed (HTTP ${page.status}, path ${page.url.pathname})`);
}

if (process.env.KAS_INSPECT_PATH || process.env.KAS_INSPECT_LINK) {
  let target = process.env.KAS_INSPECT_PATH;
  if (process.env.KAS_INSPECT_LINK) {
    target = [...page.body.matchAll(/<a[^>]*href="([^"]+)"/gi)]
      .map((match) => decodeHtml(match[1]))
      .find((href) => href.includes(process.env.KAS_INSPECT_LINK));
    if (!target) throw new Error(`KAS link not found: ${process.env.KAS_INSPECT_LINK}`);
  }
  page = await request(new URL(target, origin));
  for (let redirects = 0; redirects < 5 && page.status >= 300 && page.status < 400 && page.location; redirects += 1) {
    page = await request(new URL(page.location, page.url));
  }
}

if (process.env.KAS_SSL_DOMAIN) {
  const template = page.body.match(/const SSLLetsEncrypt = '([^']+)'/)?.[1];
  const dataJson = page.body.match(/const data = (\[[^;]+\]);/)?.[1];
  if (!template || !dataJson) throw new Error("KAS SSL overview metadata not found");
  const row = JSON.parse(dataJson).find((entry) => entry.domain === process.env.KAS_SSL_DOMAIN);
  if (!row) throw new Error(`KAS SSL domain not found: ${process.env.KAS_SSL_DOMAIN}`);
  const target = template
    .replace("DOMAIN_NAME", encodeURIComponent(row.domain))
    .replace("SOURCE", encodeURIComponent(row.source));
  page = await request(new URL(target, page.url));
  for (let redirects = 0; redirects < 5 && page.status >= 300 && page.status < 400 && page.location; redirects += 1) {
    page = await request(new URL(page.location, page.url));
  }
}

const links = [...page.body.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
  .map((match) => ({
    href: decodeHtml(match[1]),
    text: match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160),
  }))
  .filter((entry) => /domain|ssl|certificate|zertifikat|subdomain|edit|bearbeiten|staging/i.test(`${entry.href} ${entry.text}`))
  .slice(0, 100);
const scripts = [...page.body.matchAll(/<script[^>]*src="([^"]+)"/gi)].map((match) => decodeHtml(match[1]));
const forms = page.body
  .split("<form")
  .slice(1)
  .map((segment) => `<form${segment.split("</form>")[0]}</form>`)
  .map((segment) => ({
    action: decodeHtml(segment.match(/action="([^"]+)"/)?.[1] ?? ""),
    method: segment.match(/method="([^"]+)"/i)?.[1] ?? "GET",
    fields: [...segment.matchAll(/<(?:input|select|textarea)[^>]*name="([^"]+)"[^>]*>/gi)].map((match) => ({
      name: match[1],
      type: match[0].match(/type="([^"]+)"/i)?.[1] ?? match[0].match(/^<([a-z]+)/i)?.[1],
    })),
    buttons: [...segment.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)].map((match) =>
      match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120),
    ),
  }));
if (process.env.KAS_SAVE_HTML) {
  writeFileSync(process.env.KAS_SAVE_HTML, page.body, { encoding: "utf8", flag: "w" });
}
process.stdout.write(`${JSON.stringify({
  status: page.status,
  path: page.url.pathname,
  title: page.body.match(/<title[^>]*>(.*?)<\/title>/i)?.[1],
  links,
  forms,
  scripts,
  bodyBytes: Buffer.byteLength(page.body),
}, null, 2)}\n`);
