import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { request as httpsRequest } from "node:https";
import { gunzipSync } from "node:zlib";

const base = new URL(process.env.SNB_PMA_URL ?? "");
const username = process.env.SNB_DB_USER;
const password = process.env.SNB_DB_PASSWORD;
const database = process.env.SNB_DB_NAME;
const output = process.env.SNB_DB_BACKUP_OUTPUT;

if (
  base.protocol !== "https:" ||
  !username ||
  !password ||
  !database ||
  !output
) {
  throw new Error("Set HTTPS SNB_PMA_URL and all SNB_DB_* variables.");
}

const cookies = new Map();

async function request(url, { method = "GET", body } = {}) {
  const target = new URL(url, base);
  if (target.protocol !== "https:" || target.origin !== base.origin) {
    throw new Error("phpMyAdmin redirected outside its HTTPS origin.");
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
          contentType: response.headers["content-type"],
          disposition: response.headers["content-disposition"],
          body: Buffer.concat(chunks),
        });
      });
    });
    client.on("error", reject);
    client.end(body);
  });
}

await request(base);
const credentials = new URLSearchParams({
  pma_version: "5",
  pma_username: username,
  pma_password: password,
  server: "1",
}).toString();
const login = await request(base, { method: "POST", body: credentials });
if (login.status !== 302 || !login.location) {
  throw new Error(`phpMyAdmin login did not redirect (HTTP ${login.status}).`);
}
const home = await request(login.location);
if (home.status !== 200 || home.body.includes('id="login_form"')) {
  throw new Error("phpMyAdmin login failed.");
}

const server = new URL(login.location, base).searchParams.get("server");
if (!/^\d+$/.test(server ?? "")) {
  throw new Error("phpMyAdmin server identifier missing.");
}
const exportUrl = new URL("PMA5/index.php", base);
exportUrl.search = new URLSearchParams({
  route: "/database/export",
  db: database,
  server,
  lang: "en",
}).toString();
const page = await request(exportUrl);
const html = page.body.toString("utf8");
if (page.status !== 200 || !html.includes('name="Export-method"')) {
  throw new Error("phpMyAdmin export form unavailable.");
}
const form = html
  .split("<form")
  .slice(1)
  .map((segment) => `<form${segment.split("</form>")[0]}</form>`)
  .find((segment) => segment.includes('name="Export-method"'));
const token = form?.match(/name="token"\s+value="([^"]+)"/)?.[1];
if (!token) {
  throw new Error("phpMyAdmin export CSRF token missing.");
}

if (process.env.SNB_PMA_INSPECT === "1") {
  const forms = html
    .split("<form")
    .slice(1)
    .map((segment) => `<form${segment.split("</form>")[0]}</form>`);
  const actualExportForm = forms.at(-1);
  console.log(
    JSON.stringify(
      {
        forms: forms.map((segment) => ({
          action: segment.match(/action="([^"]+)"/)?.[1],
          names: [...segment.matchAll(/name="([^"]+)"/g)]
            .map((match) => match[1])
            .filter((name) => !name.includes("token"))
            .slice(-20),
          submitInputs: [...segment.matchAll(/<input[^>]*type="submit"[^>]*>/g)].map(
            (match) => match[0],
          ),
        })),
        exportInputs: [...actualExportForm.matchAll(/<input[^>]*>/g)]
          .map((match) => ({
            name: match[0].match(/name="([^"]+)"/)?.[1],
            value: match[0].match(/value="([^"]+)"/)?.[1],
            type: match[0].match(/type="([^"]+)"/)?.[1],
            checked: match[0].includes("checked"),
          }))
          .filter((input) => input.name)
          .slice(0, 100)
          .map((input) => ({
            ...input,
            value: input.name === "token" ? "[redacted]" : input.value,
          })),
        exportSelects: [...actualExportForm.matchAll(/<select[^>]*>/g)]
          .map((match) => match[0].match(/name="([^"]+)"/)?.[1])
          .slice(0, 40),
        exportUniqueInputNames: [
          ...new Set(
            [...actualExportForm.matchAll(/<input[^>]*>/g)]
              .map((match) => match[0].match(/name="([^"]+)"/)?.[1])
              .filter(Boolean),
          ),
        ],
        exportRelevantInputs: [...actualExportForm.matchAll(/<input[^>]*>/g)]
          .map((match) => ({
            name: match[0].match(/name="([^"]+)"/)?.[1],
            value: match[0].match(/value="([^"]+)"/)?.[1],
            checked: match[0].includes("checked"),
          }))
          .filter((input) =>
            ["output_format", "filename_template", "as_separate_files", "sql_structure_or_data", "sql_create_table", "sql_use_transaction"].includes(input.name),
          ),
        selectedOptions: [...actualExportForm.matchAll(/<select[^>]*>[\s\S]*?<\/select>/g)]
          .map((match) => ({
            name: match[0].match(/name="([^"]+)"/)?.[1],
            selected: match[0].match(/<option[^>]*selected[^>]*>/)?.[0],
          }))
          .filter((entry) => entry.name),
      },
    ),
  );
  process.exit(0);
}

const actualExportForm = html
  .split("<form")
  .slice(1)
  .map((segment) => `<form${segment.split("</form>")[0]}</form>`)
  .find((segment) => segment.includes('action="index.php?route=/export&'));
if (!actualExportForm) {
  throw new Error("phpMyAdmin download form missing.");
}

function decodeHtml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&");
}

const options = new URLSearchParams();
for (const match of actualExportForm.matchAll(/<input[^>]*>/g)) {
  const tag = match[0];
  const name = tag.match(/name="([^"]+)"/)?.[1];
  const type = tag.match(/type="([^"]+)"/)?.[1] ?? "text";
  if (
    !name ||
    tag.includes("disabled") ||
    ["submit", "button", "reset", "file"].includes(type) ||
    (["checkbox", "radio"].includes(type) && !tag.includes("checked"))
  ) {
    continue;
  }
  options.append(name, decodeHtml(tag.match(/value="([^"]*)"/)?.[1] ?? "on"));
}
for (const match of actualExportForm.matchAll(/<select[^>]*>[\s\S]*?<\/select>/g)) {
  const name = match[0].match(/name="([^"]+)"/)?.[1];
  if (!name || match[0].slice(0, match[0].indexOf(">")).includes("disabled")) {
    continue;
  }
  const choices = [...match[0].matchAll(/<option[^>]*>/g)];
  const selected = choices.find((choice) => choice[0].includes("selected")) ?? choices[0];
  if (selected) {
    options.append(name, decodeHtml(selected[0].match(/value="([^"]*)"/)?.[1] ?? ""));
  }
}
options.set("quick_or_custom", "quick");
options.set("what", "sql");
options.set("output_format", "sendit");
options.set("compression", "gzip");
const downloadUrl = new URL("PMA5/index.php", base);
downloadUrl.search = new URLSearchParams({ route: "/export", server }).toString();
const download = await request(downloadUrl, {
  method: "POST",
  body: options.toString(),
});
const gzip = download.body.subarray(0, 2).equals(Buffer.from([0x1f, 0x8b]));
if (download.status !== 200 || !gzip) {
  const responseHtml = download.body.toString("utf8");
  const responseTitle = responseHtml.match(/<title[^>]*>(.*?)<\/title>/i)?.[1];
  throw new Error(
    `phpMyAdmin did not return a gzip SQL export (HTTP ${download.status}, ` +
      `type ${download.contentType ?? "unknown"}, title ${responseTitle ?? "none"}, ` +
      `exportForm ${responseHtml.includes('name="Export-method"')}).`,
  );
}
const sql = gunzipSync(download.body).toString("utf8");
const tables = [...sql.matchAll(/CREATE TABLE\s+`([^`]+)`/g)].map((match) => match[1]);
if (tables.length < 10 || !tables.some((table) => table.endsWith("options"))) {
  throw new Error("SQL export failed the WordPress table sanity check.");
}
await writeFile(output, download.body, { flag: "wx" });
console.log(
  JSON.stringify({
    output,
    bytes: download.body.length,
    sqlBytes: Buffer.byteLength(sql),
    tables: tables.length,
    sha256: createHash("sha256").update(download.body).digest("hex"),
  }),
);
