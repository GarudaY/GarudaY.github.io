import { NextResponse } from "next/server";
import {
  adminCookieName,
  adminSessionCookieOptions,
  createAdminSession,
  verifyAdminPassword,
} from "@/server/admin-auth";
import { guardPublicWrite } from "@/server/request-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = guardPublicWrite(request, "admin-login");
  if (guard) return guard;

  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ code: "invalid_origin" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    password?: unknown;
  } | null;
  if (
    typeof body?.password !== "string" ||
    body.password.length < 8 ||
    body.password.length > 200 ||
    !(await verifyAdminPassword(body.password))
  ) {
    return NextResponse.json({ code: "invalid_credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(
    adminCookieName,
    await createAdminSession(),
    adminSessionCookieOptions,
  );
  return response;
}

export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ code: "invalid_origin" }, { status: 403 });
  }
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(adminCookieName, "", {
    ...adminSessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
