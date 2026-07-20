import "server-only";
import { isAllowedPublicOrigin, publicCorsHeaders } from "@/server/public-cors";

type RateEntry = { count: number; resetAt: number };

const globalRateLimit = globalThis as typeof globalThis & {
  __localRateLimits?: Map<string, RateEntry>;
};

const rateLimits =
  globalRateLimit.__localRateLimits ??
  (globalRateLimit.__localRateLimits = new Map<string, RateEntry>());

function clientAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export function guardPublicWrite(request: Request, scope: string) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (
    origin &&
    new URL(origin).host !== url.host &&
    !isAllowedPublicOrigin(origin)
  ) {
    return Response.json({ code: "invalid_origin" }, { status: 403 });
  }

  const corsHeaders = publicCorsHeaders(request);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return Response.json(
      { code: "invalid_content_type" },
      { status: 415, headers: corsHeaders },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) {
    return Response.json(
      { code: "payload_too_large" },
      { status: 413, headers: corsHeaders },
    );
  }

  const now = Date.now();
  const key = `${scope}:${clientAddress(request)}`;
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return null;
  }
  const limit = scope.startsWith("admin") ? 60 : 8;
  if (current.count >= limit) {
    return Response.json(
      { code: "rate_limited" },
      { status: 429, headers: { ...corsHeaders, "Retry-After": "600" } },
    );
  }
  current.count += 1;
  return null;
}

export function isLocalAdminHost(host: string | null) {
  const hostname = (host ?? "").split(":")[0]?.toLowerCase();
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

export function guardLocalAdmin(request: Request) {
  if (!isLocalAdminHost(request.headers.get("host"))) {
    return Response.json({ code: "local_admin_only" }, { status: 403 });
  }
  return null;
}
