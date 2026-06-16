import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/login", "/register", "/forgot-password", "/invite"];

function requestOrigin(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return req.nextUrl.origin;
  const protocol = req.headers.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const origin = requestOrigin(req);
  const isLoggedIn = Boolean(req.auth?.user);
  const isPublic =
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/invite/");

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password")) {
    return NextResponse.redirect(new URL("/", origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
