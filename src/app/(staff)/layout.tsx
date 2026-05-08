import { redirect } from "next/navigation";
import { getSession, requireRole } from "@/lib/auth";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const decision = requireRole(session, "staff");
  if (decision.kind === "redirect") redirect(decision.to);

  return <>{children}</>;
}
