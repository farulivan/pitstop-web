import { NextResponse, type NextRequest } from "next/server";
import { decideAccess, verifySession, SESSION_COOKIE } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const decision = decideAccess({ session, pathname });
  if (decision.kind === "redirect") {
    return NextResponse.redirect(new URL(decision.to, request.url));
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
