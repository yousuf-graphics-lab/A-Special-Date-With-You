import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge guard for /admin.
 *
 * A signed-in admin always carries the session cookie, so anyone without one is
 * sent to the login screen before a page is even rendered. The real authority
 * is still the server-side check in the dashboard layout and every admin API
 * route (signature + database session row), so a forged cookie gets nowhere.
 */
const SESSION_COOKIE = "fsd_admin_session";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasSession = request.cookies.has(SESSION_COOKIE);
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
