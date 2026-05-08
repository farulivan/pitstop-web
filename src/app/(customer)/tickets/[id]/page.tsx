import { Placeholder } from "@/components/shared/placeholder";

export default async function CustomerTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Placeholder
      title={`Ticket ${id}`}
      description="Live status page — Server Component fetches initial data; Client Component subscribes to WS for updates."
    />
  );
}
