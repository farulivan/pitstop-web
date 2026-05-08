import type { Role } from "@/lib/api/types";
import type { SessionPayload } from "./session";

export type Decision = { kind: "allow" } | { kind: "redirect"; to: string };

const STAFF_ROLES: Role[] = ["mechanic", "service_advisor", "owner"];

const AUTH_PREFIXES = ["/login", "/register"];
const CUSTOMER_PREFIXES = ["/book", "/tickets", "/vehicles"];
const STAFF_PREFIXES = ["/dashboard"];

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isStaff(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

export function homeForRole(role: Role): string {
  return role === "customer" ? "/tickets" : "/dashboard";
}

export function decideAccess({
  session,
  pathname,
}: {
  session: SessionPayload | null;
  pathname: string;
}): Decision {
  const isAuthRoute = startsWithAny(pathname, AUTH_PREFIXES);
  const isCustomerRoute = startsWithAny(pathname, CUSTOMER_PREFIXES);
  const isStaffRoute = startsWithAny(pathname, STAFF_PREFIXES);

  if (session && isAuthRoute) {
    return { kind: "redirect", to: homeForRole(session.role) };
  }

  if (!session && (isCustomerRoute || isStaffRoute)) {
    const params = new URLSearchParams({ next: pathname });
    return { kind: "redirect", to: `/login?${params.toString()}` };
  }

  if (session) {
    if (isStaffRoute && !isStaff(session.role)) {
      return { kind: "redirect", to: "/403" };
    }
    if (isCustomerRoute && session.role !== "customer") {
      return { kind: "redirect", to: homeForRole(session.role) };
    }
  }

  return { kind: "allow" };
}

export function requireRole(
  session: SessionPayload | null,
  group: "staff" | "customer",
): Decision {
  if (!session) return { kind: "redirect", to: "/login" };
  if (group === "staff" && !isStaff(session.role)) {
    return { kind: "redirect", to: "/403" };
  }
  if (group === "customer" && session.role !== "customer") {
    return { kind: "redirect", to: homeForRole(session.role) };
  }
  return { kind: "allow" };
}
