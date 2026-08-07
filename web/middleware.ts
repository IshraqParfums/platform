import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_ACCESS_COOKIE } from "@/lib/auth/constants";
import {
  ADMIN_LOGIN,
  ADMIN_PATHNAME_HEADER,
  adminLoginPath,
} from "@/lib/auth/admin-routes";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === ADMIN_LOGIN) {
    return NextResponse.next();
  }

  const nextTarget = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (!request.cookies.has(ADMIN_ACCESS_COOKIE)) {
    return NextResponse.redirect(
      new URL(adminLoginPath(nextTarget), request.url),
    );
  }

  const response = NextResponse.next();
  response.headers.set(ADMIN_PATHNAME_HEADER, nextTarget);
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
