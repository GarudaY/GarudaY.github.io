const base = new URL(process.env.SNB_WP_URL ?? "");
const user = process.env.SNB_HTTP_USER;
const password = process.env.SNB_HTTP_PASSWORD;
if (base.protocol !== "https:" || !user || !password)
  throw new Error("Set SNB_WP_URL, SNB_HTTP_USER and SNB_HTTP_PASSWORD");
const authorization = `Basic ${Buffer.from(`${user}:${password}`, "utf8").toString("base64")}`;
const paths = [
  "/",
  "/uk/",
  "/de/",
  "/uk/people/natalia-petrova/",
  "/uk/events/",
  "/wp-json/sonnenblume/v1/people/public",
  "/wp-json/sonnenblume/v1/partners/public",
  "/wp-json/sonnenblume/v1/registrations?event=missing",
];
const results = [];
for (const path of paths) {
  const target = new URL(path, base);
  const response = await fetch(target, {
    headers: { Authorization: authorization },
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  results.push({
    path,
    status: response.status,
    contentType: response.headers.get("content-type"),
    newSite: text.includes("/_next/static"),
    schema: text.includes('"schemaVersion":1'),
    oldTheme: text.includes("wp-content/themes"),
  });
}
process.stdout.write(`${JSON.stringify(results)}\n`);
