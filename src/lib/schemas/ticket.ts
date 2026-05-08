import { z } from "zod";

export const TICKET_STATES = [
  "booked",
  "checked_in",
  "diagnosing",
  "in_repair",
  "ready_for_pickup",
  "completed",
] as const;

export const ticketStateSchema = z.enum(TICKET_STATES);
export type TicketState = z.infer<typeof ticketStateSchema>;

const ALLOWED_TRANSITIONS: Record<TicketState, readonly TicketState[]> = {
  booked: ["checked_in"],
  checked_in: ["diagnosing"],
  diagnosing: ["in_repair"],
  in_repair: ["ready_for_pickup"],
  ready_for_pickup: ["completed"],
  completed: [],
};

export function isAllowedTransition(
  from: TicketState,
  to: TicketState,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export const transitionSchema = z
  .object({
    from: ticketStateSchema,
    to: ticketStateSchema,
    note: z.string().max(500).optional(),
  })
  .refine((value) => isAllowedTransition(value.from, value.to), {
    message: "This state transition is not allowed",
    path: ["to"],
  });

export type TransitionInput = z.infer<typeof transitionSchema>;
