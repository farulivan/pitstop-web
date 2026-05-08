import type { TicketState } from "@/lib/schemas/ticket";
import type { ServiceType } from "@/lib/schemas/booking";

export type Role = "customer" | "mechanic" | "service_advisor" | "owner";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type Vehicle = {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  plate: string;
};

export type Ticket = {
  id: string;
  vehicleId: string;
  customerId: string;
  state: TicketState;
  serviceType: ServiceType;
  notes?: string;
  assignedMechanicId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  vehicleId: string;
  serviceType: ServiceType;
  preferredSlot: string;
  notes?: string;
};

export type AuditLogEntry = {
  id: string;
  ticketId: string;
  actorId: string;
  actorName: string;
  from: TicketState | null;
  to: TicketState;
  note?: string;
  at: string;
};

export type Invoice = {
  ticketId: string;
  number: string;
  issuedAt: string;
  lineItems: Array<{ label: string; amountCents: number }>;
  totalCents: number;
};

export type AnalyticsToday = {
  averageTimeInStateMs: Record<TicketState, number>;
  bayUtilizationPct: number;
};

export type AuthLoginResponse = {
  token: string;
  user: User;
};

export type ApiErrorBody = {
  message: string;
  code?: string;
  fields?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}
