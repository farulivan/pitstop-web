"use server";

import { updateTag } from "next/cache";
import { apiServer } from "@/lib/api/server";
import { transitionSchema } from "@/lib/schemas/ticket";
import type { Ticket } from "@/lib/api/types";

export async function transitionTicketAction(
  ticketId: string,
  input: unknown,
): Promise<Ticket> {
  const parsed = transitionSchema.parse(input);
  const ticket = await apiServer<Ticket>(`/tickets/${ticketId}/transition`, {
    method: "POST",
    body: parsed,
  });
  updateTag("tickets");
  return ticket;
}
