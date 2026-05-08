import { http, HttpResponse } from "msw";
import { signSession } from "@/lib/auth/session";
import type {
  AuthLoginResponse,
  Booking,
  Invoice,
  Ticket,
} from "@/lib/api/types";
import { isAllowedTransition, type TicketState } from "@/lib/schemas/ticket";
import {
  seedAnalytics,
  seedAuditLog,
  seedInvoices,
  seedTickets,
  seedUsers,
  seedVehicles,
} from "./data";

const tickets = [...seedTickets];
const auditLog = [...seedAuditLog];
const invoices = [...seedInvoices];

const baseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";
const url = (path: string) => `${baseUrl}${path}`;

export const handlers = [
  http.post(url("/auth/login"), async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = seedUsers.find(
      (u) => u.email === body.email && u.password === body.password,
    );
    if (!user) {
      return HttpResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }
    const token = await signSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    return HttpResponse.json<AuthLoginResponse>({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }),

  http.post(url("/auth/logout"), () => HttpResponse.json({ ok: true })),

  http.get(url("/me"), ({ request }) => {
    const auth = request.headers.get("authorization");
    if (!auth) return new HttpResponse(null, { status: 401 });
    return HttpResponse.json({ ok: true });
  }),

  http.get(url("/tickets"), () => HttpResponse.json(tickets)),

  http.get(url("/tickets/:id"), ({ params }) => {
    const ticket = tickets.find((t) => t.id === params.id);
    if (!ticket) return new HttpResponse(null, { status: 404 });
    const log = auditLog.filter((entry) => entry.ticketId === ticket.id);
    return HttpResponse.json({ ticket, auditLog: log });
  }),

  http.post(url("/tickets"), async ({ request }) => {
    const body = (await request.json()) as Booking;
    const ticket: Ticket = {
      id: `t_${tickets.length + 1}`,
      vehicleId: body.vehicleId,
      customerId: "u_customer",
      state: "booked",
      serviceType: body.serviceType,
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tickets.push(ticket);
    return HttpResponse.json(ticket, { status: 201 });
  }),

  http.post(url("/tickets/:id/transition"), async ({ params, request }) => {
    const ticket = tickets.find((t) => t.id === params.id);
    if (!ticket) return new HttpResponse(null, { status: 404 });
    const body = (await request.json()) as {
      from: TicketState;
      to: TicketState;
      note?: string;
    };
    if (
      ticket.state !== body.from ||
      !isAllowedTransition(body.from, body.to)
    ) {
      return HttpResponse.json(
        { message: "Invalid transition" },
        { status: 400 },
      );
    }
    ticket.state = body.to;
    ticket.updatedAt = new Date().toISOString();
    auditLog.push({
      id: `a_${ticket.id}_${auditLog.length}`,
      ticketId: ticket.id,
      actorId: "u_advisor",
      actorName: "Adi Advisor",
      from: body.from,
      to: body.to,
      note: body.note,
      at: ticket.updatedAt,
    });
    return HttpResponse.json(ticket);
  }),

  http.get(url("/vehicles"), () => HttpResponse.json(seedVehicles)),

  http.post(url("/bookings"), async ({ request }) => {
    const body = (await request.json()) as Booking;
    return HttpResponse.json({ accepted: true, requested: body });
  }),

  http.get(url("/invoices/:ticketId"), ({ params }) => {
    const invoice = invoices.find((i) => i.ticketId === params.ticketId);
    if (!invoice) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json<Invoice>(invoice);
  }),

  http.get(url("/analytics/today"), () => HttpResponse.json(seedAnalytics)),
];
