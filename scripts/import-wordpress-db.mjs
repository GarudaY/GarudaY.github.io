import { readFile } from "node:fs/promises";
import { request as httpsRequest } from "node:https";
import { randomBytes } from "node:crypto";

const base = new URL(process.env.SNB_PMA_URL ?? "");
const username = process.env.SNB_DB_USER;
const password = process.env.SNB_DB_PASSWORD;
const database = process.env.SNB_DB_NAME;
const input = process.env.SNB_DB_BACKUP_INPUT;

if (base.protocol !== "https:" || !username || !password || !database || !input) {
  throw new Error("Set HTTPS SNB_PMA_URL, SNB_DB_USER, SNB_DB_PASSWORD, SNB_DB_NAME, and SNB_DB_BACKUP_INPUT.");
}

const cookies = new Map();

async function request(url, { method = "GET", body, headers: extraHeaders = {} } = {}) {
  const target = new URL(url, base);
  if (target.protocol !== "https:" || target.origin !== base.origin) {
    throw new Error("phpMyAdmin redirected outside its HTTPS origin.");
  }

  return new Promise((resolve, reject) => {
    const headers = {
      Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join("; "),
      ...extraHeaders,
    };
    if (body !== undefined) headers["Content-Length"] = Buffer.byteLength(body);
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
          contentType: response.headers["content-type"],
          body: Buffer.concat(chunks),
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

await request(base);
const credentials = new URLSearchParams({
  pma_version: "5",
  pma_username: username,
  pma_password: password,
  server: "1",
}).toString();
const login = await request(base, {
  method: "POST",
  body: credentials,
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});
if (login.status !== 302 || !login.location) {
  throw new Error(`phpMyAdmin login did not redirect (HTTP ${login.status}).`);
}
const home = await request(login.location);
if (home.status !== 200 || home.body.includes('id="login_form"')) {
  throw new Error("phpMyAdmin login failed.");
}

const server = new URL(login.location, base).searchParams.get("server");
if (!/^\d+$/.test(server ?? "")) throw new Error("phpMyAdmin server identifier missing.");

const importPageUrl = new URL("PMA5/index.php", base);
importPageUrl.search = new URLSearchParams({
  route: "/database/import",
  db: database,
  server,
  lang: "en",
}).toString();
const page = await request(importPageUrl);
const html = page.body.toString("utf8");
const form = html
  .split("<form")
  .slice(1)
  .map((segment) => `<form${segment.split("</form>")[0]}</form>`)
  .find((segment) => segment.includes('name="import_file"'));
if (page.status !== 200 || !form) throw new Error("phpMyAdmin import form unavailable.");

const action = decodeHtml(form.match(/action="([^"]+)"/)?.[1] ?? "");
if (!action) throw new Error("phpMyAdmin import form action missing.");

const fields = [];
for (const match of form.matchAll(/<input[^>]*>/g)) {
  const tag = match[0];
  const name = tag.match(/name="([^"]+)"/)?.[1];
  const type = tag.match(/type="([^"]+)"/)?.[1] ?? "text";
  if (
    !name ||
    tag.includes("disabled") ||
    ["submit", "button", "reset", "file"].includes(type) ||
    (["checkbox", "radio"].includes(type) && !tag.includes("checked"))
  ) continue;
  fields.push([name, decodeHtml(tag.match(/value="([^"]*)"/)?.[1] ?? "on")]);
}
for (const match of form.matchAll(/<select[^>]*>[\s\S]*?<\/select>/g)) {
  const name = match[0].match(/name="([^"]+)"/)?.[1];
  if (!name || match[0].slice(0, match[0].indexOf(">"))?.includes("disabled")) continue;
  const options = [...match[0].matchAll(/<option[^>]*>/g)];
  const selected = options.find((choice) => choice[0].includes("selected")) ?? options[0];
  if (selected) fields.push([name, decodeHtml(selected[0].match(/value="([^"]*)"/)?.[1] ?? "")]);
}

const setField = (name, value) => {
  for (let index = fields.length - 1; index >= 0; index -= 1) {
    if (fields[index][0] === name) fields.splice(index, 1);
  }
  fields.push([name, value]);
};
setField("db", database);
setField("server", server);
setField("import_type", "database");
setField("format", "sql");
setField("charset_of_file", "utf-8");

const gzip = await readFile(input);
if (!gzip.subarray(0, 2).equals(Buffer.from([0x1f, 0x8b]))) {
  throw new Error("Input is not a gzip-compressed SQL dump.");
}

const boundary = `----sonnenblume-${randomBytes(18).toString("hex")}`;
const chunks = [];
const add = (value) => chunks.push(Buffer.from(value, "utf8"));
for (const [name, value] of fields) {
  add(`--${boundary}\r\n`);
  add(`Content-Disposition: form-data; name="${name.replaceAll('"', "")}"\r\n\r\n`);
  add(`${value}\r\n`);
}
add(`--${boundary}\r\n`);
add('Content-Disposition: form-data; name="import_file"; filename="sonnenblume-staging.sql.gz"\r\n');
add("Content-Type: application/gzip\r\n\r\n");
chunks.push(gzip);
add(`\r\n--${boundary}--\r\n`);
const body = Buffer.concat(chunks);

const importAction = new URL(action, importPageUrl);
const imported = await request(importAction, {
  method: "POST",
  body,
  headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
});
const responseHtml = imported.body.toString("utf8");
const alerts = [...responseHtml.matchAll(/<div[^>]*class="[^"]*alert-(success|danger|warning|info)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)]
  .map((match) => ({
    type: match[1].toLowerCase(),
    text: match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000),
  }));
const hasError =
  alerts.some((alert) => alert.type === "danger") ||
  /Import failed|SQL query.*error/i.test(responseHtml);
const hasSuccess =
  /Import has been successfully finished/i.test(responseHtml) ||
  alerts.some((alert) => alert.type === "success");
if (process.env.SNB_PMA_INSPECT_IMPORT === "1") {
  process.stdout.write(`${JSON.stringify({
    status: imported.status,
    alerts,
    hasSuccess,
    hasError,
    hasImportForm: responseHtml.includes('name="import_file"'),
  }, null, 2)}\n`);
  process.exit(0);
}
if (imported.status !== 200 || hasError || !hasSuccess) {
  const title = responseHtml.match(/<title[^>]*>(.*?)<\/title>/i)?.[1];
  throw new Error(
    `phpMyAdmin import was not confirmed (HTTP ${imported.status}, title ${title ?? "none"}, ` +
      `success ${hasSuccess}, error ${hasError}, alerts ${JSON.stringify(alerts)}).`,
  );
}

process.stdout.write(`${JSON.stringify({ database, compressedBytes: gzip.length, imported: true })}\n`);
