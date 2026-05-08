import "server-only";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "pitstop_session";

const SEVEN_DAYS = 60 * 60 * 24 * 7;

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
