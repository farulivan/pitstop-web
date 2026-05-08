import { Placeholder } from "@/components/shared/placeholder";

export default async function StaffTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Placeholder
      title={`Ticket ${id} (staff view)`}
      description="State transitions, audit log, and invoice generation."
    />
  );
}
