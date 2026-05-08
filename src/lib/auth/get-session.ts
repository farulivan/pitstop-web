import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./cookies";
import { verifySession, type SessionPayload } from "./session";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifySession(token);
}
