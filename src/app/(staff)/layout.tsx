import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/get-session";
import type { Role } from "@/lib/api/types";

const STAFF_ROLES: Role[] = ["mechanic", "service_advisor", "owner"];

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!STAFF_ROLES.includes(session.role)) redirect("/403");

  return <>{children}</>;
}
