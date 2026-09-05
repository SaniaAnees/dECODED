import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** API and Next internals must never be subdomain-rewritten. */
function isPassthrough(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  );
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];
  const pathname = request.nextUrl.pathname;

  // Canonical production host: wrayle.com (apex), not www.
  if (hostname === "www.wrayle.com") {
    const url = request.nextUrl.clone();
    url.hostname = "wrayle.com";
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (isPassthrough(pathname)) {
    return NextResponse.next();
  }

  if (hostname.startsWith("proxy.")) {
    const url = request.nextUrl.clone();
    const path = url.pathname === "/" ? "/proxy" : `/proxy${url.pathname}`;
    if (!url.pathname.startsWith("/proxy")) {
      url.pathname = path;
      return NextResponse.rewrite(url);
    }
  }

  if (hostname.startsWith("auth.")) {
    const url = request.nextUrl.clone();
    const path = url.pathname === "/" ? "/sign-in" : `/sign-in${url.pathname}`;
    if (!url.pathname.startsWith("/sign-in")) {
      url.pathname = path;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
