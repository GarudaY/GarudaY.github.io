import "server-only";

const defaultPublicOrigins = ["https://garuday.github.io"];

function allowedOrigins() {
  const configured = process.env.PUBLIC_FORM_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(configured?.length ? configured : defaultPublicOrigins);
}

export function isAllowedPublicOrigin(origin: string) {
  try {
    return allowedOrigins().has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export function publicCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin || !isAllowedPublicOrigin(origin)) return {};

  return {
    "Access-Control-Allow-Origin": new URL(origin).origin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function publicCorsPreflight(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || !isAllowedPublicOrigin(origin)) {
    return Response.json({ code: "invalid_origin" }, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: publicCorsHeaders(request),
  });
}
