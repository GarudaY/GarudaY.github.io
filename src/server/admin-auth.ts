import "server-only";
import { isLocalAdminHost } from "@/server/request-guard";

export const adminCookieName = "sonnenblume_admin";
const sessionLifetimeSeconds = 8 * 60 * 60;

function environmentValue(name: "ADMIN_PASSWORD" | "ADMIN_SESSION_SECRET") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmac(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(environmentValue("ADMIN_SESSION_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
  );
}

async function sha256(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export async function verifyAdminPassword(password: string) {
  try {
    const [provided, expected] = await Promise.all([
      sha256(password),
      sha256(environmentValue("ADMIN_PASSWORD")),
    ]);
    return equalBytes(provided, expected);
  } catch {
    return false;
  }
}

export async function createAdminSession() {
  const payload = base64UrlEncode(
    new TextEncoder().encode(
      JSON.stringify({
        expiresAt: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds,
        nonce: crypto.randomUUID(),
      }),
    ),
  );
  const signature = base64UrlEncode(await hmac(payload));
  return `${payload}.${signature}`;
}

export async function verifyAdminSession(token: string | undefined) {
  if (!token) return false;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;

  try {
    const expected = await hmac(payload);
    if (!equalBytes(expected, base64UrlDecode(signature))) return false;
    const session = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payload)),
    ) as { expiresAt?: unknown };
    return (
      typeof session.expiresAt === "number" &&
      session.expiresAt > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

function cookieValue(cookieHeader: string | null, name: string) {
  const prefix = `${name}=`;
  return cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

export async function isAdminRequestAuthenticated(request: Request) {
  if (isLocalAdminHost(request.headers.get("host"))) return true;
  return verifyAdminSession(
    cookieValue(request.headers.get("cookie"), adminCookieName),
  );
}

export async function guardAdminRequest(
  request: Request,
  options: { write?: boolean } = {},
) {
  if (!(await isAdminRequestAuthenticated(request))) {
    return Response.json({ code: "admin_unauthorized" }, { status: 401 });
  }

  if (options.write) {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) {
      return Response.json({ code: "invalid_origin" }, { status: 403 });
    }
  }

  return null;
}

export const adminSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: sessionLifetimeSeconds,
};
