import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Edge-safe fast reject only — cookie presence, no DB round-trip. The
// authoritative check (role, twoFactorEnabled) happens in each protected
// route group's layout via requireRole(), which runs on the Node runtime.
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/owner/:path*", "/provider/:path*", "/admin/:path*"],
};
