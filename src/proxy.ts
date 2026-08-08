import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import {
  internalToPublicSegment,
  publicToInternalSegment,
} from "@/i18n/routing";

const PUBLIC_FILE = /\.[^/]+$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0];

  if (!isLocale(locale)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  const publicSegment = segments[1];

  if (publicSegment) {
    const canonicalPublicSegment =
      internalToPublicSegment[locale][publicSegment];

    if (canonicalPublicSegment && canonicalPublicSegment !== publicSegment) {
      const url = request.nextUrl.clone();
      url.pathname = `/${[locale, canonicalPublicSegment, ...segments.slice(2)].join("/")}`;
      return NextResponse.redirect(url);
    }

    const internalSegment = publicToInternalSegment[locale][publicSegment];

    if (internalSegment && internalSegment !== publicSegment) {
      const url = request.nextUrl.clone();
      url.pathname = `/${[locale, internalSegment, ...segments.slice(2)].join("/")}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
