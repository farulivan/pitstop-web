import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import type { Role } from "@/lib/api/types";

const STAFF_ROLES: Role[] = ["mechanic", "service_advisor", "owner"];

const CUSTOMER_PREFIXES = ["/book", "/tickets", "/vehicles"];
const STAFF_PREFIXES = ["/dashboard"];
const AUTH_PREFIXES = ["/login", "/register"];

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function homeForRole(role: Role): string {
  return role === "customer" ? "/tickets" : "/dashboard";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const isAuthRoute = startsWithAny(pathname, AUTH_PREFIXES);
  const isCustomerRoute = startsWithAny(pathname, CUSTOMER_PREFIXES);
  const isStaffRoute = startsWithAny(pathname, STAFF_PREFIXES);

  if (session && isAuthRoute) {
    return NextResponse.redirect(
      new URL(homeForRole(session.role), request.url),
    );
  }

  if (!session && (isCustomerRoute || isStaffRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session) {
    if (isStaffRoute && !STAFF_ROLES.includes(session.role)) {
      return NextResponse.redirect(new URL("/403", request.url));
    }
    if (isCustomerRoute && session.role !== "customer") {
      return NextResponse.redirect(
        new URL(homeForRole(session.role), request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/book/:path*",
    "/tickets/:path*",
    "/vehicles/:path*",
    "/dashboard/:path*",
  ],
};
