import { describe, expect, it } from "vitest";
import {
  decideAccess,
  requireRole,
  homeForRole,
  isStaff,
} from "@/lib/auth/policy";
import type { SessionPayload } from "@/lib/auth/session";
import type { Role } from "@/lib/api/types";

const sessionFor = (role: Role): SessionPayload => ({
  userId: "u1",
  email: "u@example.com",
  role,
});

describe("isStaff", () => {
  it("returns true for staff roles", () => {
    expect(isStaff("mechanic")).toBe(true);
    expect(isStaff("service_advisor")).toBe(true);
    expect(isStaff("owner")).toBe(true);
  });
  it("returns false for customer", () => {
    expect(isStaff("customer")).toBe(false);
  });
});

describe("homeForRole", () => {
  it("sends customers to /tickets", () => {
    expect(homeForRole("customer")).toBe("/tickets");
  });
  it("sends every staff role to /dashboard", () => {
    expect(homeForRole("mechanic")).toBe("/dashboard");
    expect(homeForRole("service_advisor")).toBe("/dashboard");
    expect(homeForRole("owner")).toBe("/dashboard");
  });
});

describe("decideAccess", () => {
  describe("no session", () => {
    it("allows auth routes", () => {
      expect(decideAccess({ session: null, pathname: "/login" })).toEqual({
        kind: "allow",
      });
      expect(decideAccess({ session: null, pathname: "/register" })).toEqual({
        kind: "allow",
      });
    });
    it("redirects to /login with next= on customer routes", () => {
      expect(decideAccess({ session: null, pathname: "/tickets/abc" })).toEqual(
        {
          kind: "redirect",
          to: "/login?next=%2Ftickets%2Fabc",
        },
      );
    });
    it("redirects to /login with next= on staff routes", () => {
      expect(decideAccess({ session: null, pathname: "/dashboard" })).toEqual({
        kind: "redirect",
        to: "/login?next=%2Fdashboard",
      });
    });
    it("allows unmatched routes", () => {
      expect(decideAccess({ session: null, pathname: "/" })).toEqual({
        kind: "allow",
      });
    });
  });

  describe("with session", () => {
    it("redirects logged-in customer off auth routes to /tickets", () => {
      expect(
        decideAccess({ session: sessionFor("customer"), pathname: "/login" }),
      ).toEqual({ kind: "redirect", to: "/tickets" });
    });
    it("redirects logged-in staff off auth routes to /dashboard", () => {
      expect(
        decideAccess({ session: sessionFor("owner"), pathname: "/register" }),
      ).toEqual({ kind: "redirect", to: "/dashboard" });
    });
    it("allows customer on customer route", () => {
      expect(
        decideAccess({
          session: sessionFor("customer"),
          pathname: "/tickets",
        }),
      ).toEqual({ kind: "allow" });
    });
    it("redirects customer off staff route to /403", () => {
      expect(
        decideAccess({
          session: sessionFor("customer"),
          pathname: "/dashboard",
        }),
      ).toEqual({ kind: "redirect", to: "/403" });
    });
    it("redirects staff off customer route to /dashboard", () => {
      expect(
        decideAccess({
          session: sessionFor("mechanic"),
          pathname: "/tickets",
        }),
      ).toEqual({ kind: "redirect", to: "/dashboard" });
    });
    it("allows staff on staff route", () => {
      expect(
        decideAccess({
          session: sessionFor("service_advisor"),
          pathname: "/dashboard",
        }),
      ).toEqual({ kind: "allow" });
    });
    it("allows session on unmatched route", () => {
      expect(
        decideAccess({
          session: sessionFor("customer"),
          pathname: "/about",
        }),
      ).toEqual({ kind: "allow" });
    });
  });
});

describe("requireRole", () => {
  it("redirects null session to /login", () => {
    expect(requireRole(null, "staff")).toEqual({
      kind: "redirect",
      to: "/login",
    });
    expect(requireRole(null, "customer")).toEqual({
      kind: "redirect",
      to: "/login",
    });
  });
  it("allows staff in staff group", () => {
    expect(requireRole(sessionFor("mechanic"), "staff")).toEqual({
      kind: "allow",
    });
    expect(requireRole(sessionFor("service_advisor"), "staff")).toEqual({
      kind: "allow",
    });
    expect(requireRole(sessionFor("owner"), "staff")).toEqual({
      kind: "allow",
    });
  });
  it("redirects customer out of staff group to /403", () => {
    expect(requireRole(sessionFor("customer"), "staff")).toEqual({
      kind: "redirect",
      to: "/403",
    });
  });
  it("allows customer in customer group", () => {
    expect(requireRole(sessionFor("customer"), "customer")).toEqual({
      kind: "allow",
    });
  });
  it("redirects staff out of customer group to /dashboard", () => {
    expect(requireRole(sessionFor("mechanic"), "customer")).toEqual({
      kind: "redirect",
      to: "/dashboard",
    });
    expect(requireRole(sessionFor("owner"), "customer")).toEqual({
      kind: "redirect",
      to: "/dashboard",
    });
  });
});
