#!/usr/bin/env node

import { XMLParser } from "fast-xml-parser";

const endpoint = process.env.KAS_API_URL ?? "https://kasapi.kasserver.com/soap/KasApi.php";
const login = process.env.KAS_LOGIN;
const password = process.env.KAS_PASSWORD;
const action = process.argv[2];
const encodedParams = process.env.KAS_REQUEST_PARAMS_B64 ?? "e30=";

if (!login || !password) {
  throw new Error("KAS_LOGIN and KAS_PASSWORD are required");
}

if (!action || !/^[a-z_]+$/.test(action)) {
  throw new Error("Pass a KAS action as the first argument");
}

let params;
try {
  params = JSON.parse(Buffer.from(encodedParams, "base64").toString("utf8"));
} catch {
  throw new Error("KAS_REQUEST_PARAMS_B64 must contain base64-encoded JSON");
}

const request = JSON.stringify({
  kas_login: login,
  kas_auth_type: "plain",
  kas_auth_data: password,
  kas_action: action,
  KasRequestParams: params,
});

const xmlEscape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const xmlUnescape = (value) =>
  value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&amp;", "&");

const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:xmethodsKasApi">
  <SOAP-ENV:Body>
    <ns1:KasApi>
      <KasRequest>${xmlEscape(request)}</KasRequest>
    </ns1:KasApi>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "text/xml; charset=utf-8",
    SOAPAction: "urn:xmethodsKasApi#KasApi",
  },
  body: envelope,
  signal: AbortSignal.timeout(30_000),
});

const body = await response.text();
if (!response.ok) {
  throw new Error(`KAS API returned HTTP ${response.status}`);
}

const fault = body.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/i);
if (fault) {
  throw new Error(`KAS SOAP fault: ${xmlUnescape(fault[1].trim())}`);
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  textNodeName: "#text",
  trimValues: true,
  isArray: (name) => name === "item",
});
const document = parser.parse(body);

const findReturn = (value) => {
  if (!value || typeof value !== "object") return undefined;
  for (const [key, child] of Object.entries(value)) {
    if (key.toLowerCase().endsWith(":return") || key.toLowerCase() === "return") return child;
    const nested = findReturn(child);
    if (nested !== undefined) return nested;
  }
  return undefined;
};

const result = findReturn(document);
if (result === undefined) {
  throw new Error("KAS API response did not contain a return value");
}

const decodeSoap = (value) => {
  if (value === null || value === undefined || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(decodeSoap);

  const items = value.item;
  if (Array.isArray(items)) {
    const isMap = items.every((item) => item && typeof item === "object" && item.key !== undefined);
    if (isMap) {
      return Object.fromEntries(
        items.map((item) => [String(decodeSoap(item.key)), decodeSoap(item.value)]),
      );
    }
    return items.map(decodeSoap);
  }

  if (Object.hasOwn(value, "#text")) return value["#text"];
  if (String(value["@xsi:type"] ?? "").endsWith(":Array")) return [];

  const contentEntries = Object.entries(value).filter(([key]) => !key.startsWith("@"));
  if (contentEntries.length === 0) return null;
  if (contentEntries.length === 1) return decodeSoap(contentEntries[0][1]);
  return Object.fromEntries(contentEntries.map(([key, child]) => [key, decodeSoap(child)]));
};

const parsed = decodeSoap(result);

if (parsed?.Response?.Error?.ErrorCode) {
  const { ErrorCode, ErrorText } = parsed.Response.Error;
  throw new Error(`KAS API error ${ErrorCode}: ${ErrorText ?? "unknown error"}`);
}

process.stdout.write(`${JSON.stringify(parsed, null, 2)}\n`);
