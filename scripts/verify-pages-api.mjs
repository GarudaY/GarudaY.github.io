import {
  resolvePagesApiBase,
  resolvePagesApiMode,
  verifyPagesApiConfiguration,
} from "./prepare-github-pages.mjs";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://garuday.github.io"
).replace(/\/$/, "");
const apiBaseUrl = resolvePagesApiBase(
  siteUrl,
  process.env.NEXT_PUBLIC_API_BASE_URL,
);
const apiMode = resolvePagesApiMode(
  apiBaseUrl,
  process.env.NEXT_PUBLIC_API_MODE,
);

verifyPagesApiConfiguration(siteUrl, apiBaseUrl, apiMode);

const contactPath =
  apiMode === "wordpress"
    ? "/wp-json/sonnenblume/v1/contact"
    : "/api/contact";
const endpoint = new URL(contactPath, `${apiBaseUrl}/`);
const origin = new URL(siteUrl).origin;
const response = await fetch(endpoint, {
  method: "OPTIONS",
  headers: {
    Origin: origin,
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type",
  },
  redirect: "error",
  signal: AbortSignal.timeout(30_000),
});

const allowedOrigin = response.headers.get("access-control-allow-origin");
const allowedMethods = response.headers.get("access-control-allow-methods") ?? "";
const allowedHeaders = response.headers.get("access-control-allow-headers") ?? "";

if (
  response.status !== 204 ||
  allowedOrigin !== origin ||
  !allowedMethods
    .split(",")
    .map((method) => method.trim().toUpperCase())
    .includes("POST") ||
  !allowedHeaders
    .split(",")
    .map((header) => header.trim().toLowerCase())
    .includes("content-type")
) {
  throw new Error(
    `Public form API preflight failed: ${response.status} origin=${allowedOrigin ?? "missing"}`,
  );
}

console.log(
  `Public form API ready: ${endpoint.origin}${endpoint.pathname} (${apiMode})`,
);
