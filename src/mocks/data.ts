import type {
  AnalyticsToday,
  AuditLogEntry,
  Invoice,
  Ticket,
  User,
  Vehicle,
} from "@/lib/api/types";
import type { TicketState } from "@/lib/schemas/ticket";

export const seedUsers: Array<User & { password: string }> = [
  {
    id: "u_customer",
    email: "customer@example.com",
    name: "Casey Customer",
    role: "customer",
    password: "password123",
  },
  {
    id: "u_mechanic",
    email: "mechanic@example.com",
    name: "Marin Mechanic",
    role: "mechanic",
    password: "password123",
  },
  {
    id: "u_advisor",
    email: "advisor@example.com",
    name: "Adi Advisor",
    role: "service_advisor",
    password: "password123",
  },
  {
    id: "u_owner",
    email: "owner@example.com",
    name: "Olive Owner",
    role: "owner",
    password: "password123",
  },
];

export const seedVehicles: Vehicle[] = [
  {
    id: "v_001",
    ownerId: "u_customer",
    make: "Toyota",
    model: "Camry",
    year: 2018,
    plate: "B 1234 ABC",
  },
  {
    id: "v_002",
    ownerId: "u_customer",
    make: "Honda",
    model: "Civic",
    year: 2021,
    plate: "B 5678 XYZ",
  },
];

const STATES: TicketState[] = [
  "booked",
  "checked_in",
  "diagnosing",
  "in_repair",
  "ready_for_pickup",
  "completed",
];

const now = Date.now();

export const seedTickets: Ticket[] = STATES.map((state, idx) => ({
  id: `t_${String(idx + 1).padStart(3, "0")}`,
  vehicleId: idx % 2 === 0 ? "v_001" : "v_002",
  customerId: "u_customer",
  state,
  serviceType: idx % 2 === 0 ? "oil_change" : "brake_service",
  notes:
    state === "diagnosing" ? "Customer reports a rattling sound." : undefined,
  assignedMechanicId: state === "booked" ? undefined : "u_mechanic",
  createdAt: new Date(now - (idx + 1) * 1000 * 60 * 60 * 6).toISOString(),
  updatedAt: new Date(now - (idx + 1) * 1000 * 60 * 30).toISOString(),
}));

export const seedAuditLog: AuditLogEntry[] = seedTickets
  .filter((t) => t.state !== "booked")
  .flatMap((t, idx) => {
    const order: TicketState[] = STATES.slice(0, STATES.indexOf(t.state) + 1);
    return order.map((to, i) => ({
      id: `a_${t.id}_${i}`,
      ticketId: t.id,
      actorId: i === 0 ? t.customerId : "u_advisor",
      actorName: i === 0 ? "Casey Customer" : "Adi Advisor",
      from: i === 0 ? null : order[i - 1],
      to,
      at: new Date(now - (idx + 1) * 1000 * 60 * 60 * (5 - i)).toISOString(),
    }));
  });

export const seedInvoices: Invoice[] = seedTickets
  .filter((t) => t.state === "completed")
  .map((t) => ({
    ticketId: t.id,
    number: `INV-${t.id.toUpperCase()}`,
    issuedAt: t.updatedAt,
    lineItems: [
      { label: "Labor (1.5h)", amountCents: 18000 },
      { label: "Parts", amountCents: 9500 },
    ],
    totalCents: 27500,
  }));

export const seedAnalytics: AnalyticsToday = {
  averageTimeInStateMs: {
    booked: 1000 * 60 * 30,
    checked_in: 1000 * 60 * 20,
    diagnosing: 1000 * 60 * 45,
    in_repair: 1000 * 60 * 90,
    ready_for_pickup: 1000 * 60 * 25,
    completed: 0,
  },
  bayUtilizationPct: 72,
};
