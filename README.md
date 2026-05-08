# Pitstop — Auto Service Ticket System

A web app for an auto service shop: customers book online and watch their ticket move through the bay; staff (mechanics, service advisors, owner) work a live dashboard and trigger state transitions; everything is audited.

This repository is the **Next.js frontend**. The backend is a separate Go service (out of scope here); during local development and the public demo deploy, all API calls are intercepted by [MSW](https://mswjs.io) so the app is fully interactive without the backend.

---

## Problem

Small auto service shops typically run on whiteboards, paper tickets, and SMS threads. The information that matters — _what state is this car in, who has it, when did it move, what's the bill_ — is scattered. Pitstop centralizes that workflow without the bloat of an enterprise DMS.

**In scope**

- Customers book a service (vehicle info + service type + preferred slot).
- Staff dashboard showing incoming bookings; tickets move through `booked → checked_in → diagnosing → in_repair → ready_for_pickup → completed`.
- Customer-facing live status page (WebSocket-driven).
- Role-based auth: `customer`, `mechanic`, `service_advisor`, `owner`.
- Ticket history per customer and per vehicle.
- Simple HTML/PDF invoice at completion.
- Audit log of every state transition (who changed what, when).
- One small slice of analytics: average time per state, today's bay utilization.

**Out of scope (deliberately)**

Parts inventory, payment processing, multi-tenancy, complex mechanic capacity planning, SMS/WhatsApp, mobile apps. Listed in [What I'd add next](#what-id-add-next).

---

## Architecture

```
src/
├── app/
│   ├── (marketing)/              # public landing
│   ├── (auth)/                   # login, register
│   ├── (customer)/               # customer portal — role gate: customer
│   │   ├── book/
│   │   ├── tickets/
│   │   │   ├── page.tsx          # list (Server Component)
│   │   │   └── [id]/page.tsx     # live status (Client + TanStack + WS)
│   │   └── vehicles/
│   ├── (staff)/                  # staff portal — role gate: mechanic|advisor|owner
│   │   └── dashboard/
│   │       ├── page.tsx          # live ticket board (Client + TanStack + WS)
│   │       ├── tickets/[id]/     # ticket detail + state transitions
│   │       └── invoices/
│   ├── 403/                      # forbidden page
│   ├── error.tsx, not-found.tsx
│   └── layout.tsx                # root: providers + MSW boot
├── components/{ui, customer, staff, shared}/
├── lib/
│   ├── api/{server, client, types}.ts   # two API clients + hand-authored types
│   ├── auth/{session, cookies, get-session}.ts
│   ├── schemas/{auth, ticket, booking}.ts   # Zod
│   ├── query/{client, keys, provider}.ts
│   └── ws/{provider, useTicketSubscription}.ts
├── server/actions/               # Server Actions
├── mocks/                        # MSW handlers + bootstrap
└── proxy.ts                      # auth + role-based route protection (Next 16's renamed middleware)

instrumentation.ts                # boots MSW in Node (SSR) for demo mode
tests/{unit, e2e}/                # Vitest + Playwright
```

---

## Key decisions

### Two route groups, two layouts, two component trees

`(customer)` and `(staff)` are [route groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups). They give us:

- distinct layouts (different shells, navs, theming hooks),
- distinct role gates (one place per group, see `src/app/(customer)/layout.tsx`),
- distinct component trees under `components/customer/` vs `components/staff/`.

This is cleaner than `if (role === "staff")` branching inside one shared layout, and the [proxy](src/proxy.ts) protects each group at the route boundary.

> **Tradeoff:** Next.js route groups can't both serve the same URL. `(customer)/tickets/[id]` and `(staff)/tickets/[id]` would collide. We resolved this by nesting staff routes under a literal `/dashboard` prefix (`(staff)/dashboard/tickets/[id]`). The route group still organizes layouts/role gates; the URL stays unambiguous.

### Auth via proxy + httpOnly cookies (not a library)

The Go API mints a JWT on login. The login Server Action sets it as an `httpOnly secure` cookie. `src/proxy.ts` (Next 16's renamed middleware) runs on every matched route, verifies the JWT signature/expiry with [jose](https://github.com/panva/jose), and either lets the request through, redirects to `/login`, or redirects to `/403` if the role doesn't match the route group.

- **Single source of truth** for route protection — no scattered `useAuth()` redirects.
- **Defense in depth**: each route-group `layout.tsx` re-checks the session server-side. If the proxy ever misroutes, the layout still bounces.
- **Edge-safe**: jose works in the Edge runtime; cookie reads in the proxy go through `request.cookies`, not `next/headers`.
- **Library-free**: no NextAuth — the cookie/JWT pattern is small enough to own, and matches a real backend handing us a token.

### Two API client modules

| Module              | Use from                              | How auth is sent                                       |
| ------------------- | ------------------------------------- | ------------------------------------------------------ |
| `lib/api/server.ts` | Server Components, Server Actions     | Reads cookie via `next/headers`, sends `Bearer` header |
| `lib/api/client.ts` | Client Components, TanStack mutations | `credentials: "include"` so the cookie travels         |

Both throw a typed `ApiError`. Both default to `cache: "no-store"` so auth-gated data is never silently cached.

Types come from `lib/api/types.ts` — hand-authored today, **regenerated** by `pnpm gen:api` once the Go service publishes its OpenAPI spec into `./openapi/pitstop.yaml`. Including [openapi-typescript](https://github.com/openapi-ts/openapi-typescript) now means swapping in the generated file is a one-step change, not a refactor.

### Server-first data flow, TanStack Query only where it matters

Default for any page: **Server Component**, fetch from the Go API in the component, pass data to child Client Components if interactivity is needed. Mutations go through Server Actions which call the API and `revalidateTag('tickets')`.

The exceptions — pages that need WS-driven live updates — go full Client + TanStack Query:

- `app/(customer)/tickets/[id]/page.tsx` — customer's live status page.
- `app/(staff)/dashboard/page.tsx` — staff's live ticket board with optimistic state transitions.

These pages get initial data from a Server Component parent that fetches and passes it as `initialData` to TanStack Query, then take over with WS-driven cache updates. SSR-then-hydrate-into-Query is the pattern that gives us SEO + fast first paint **and** live interactivity, without picking one over the other.

### WebSocket as a cache updater

`lib/ws/useTicketSubscription(ticketId)`:

1. Connects to the Go WS endpoint with the JWT.
2. On message, calls `queryClient.setQueryData(ticketKeys.detail(ticketId), updater)`.
3. Reconnects with exponential backoff; cleans up on unmount.

Because TanStack Query is the cache, every component reading that ticket auto-updates. No manual subscriber lists, no race conditions between fetched data and WS messages — Query handles the ordering.

(In this scaffolding iteration the hook signature is in place; the connection is stubbed until the Go WS endpoint is reachable.)

### Forms with Zod + React Hook Form, schemas as the single source of truth

Schemas live in `lib/schemas/`. The same schema is used by:

- React Hook Form on the client (via `zodResolver`),
- the Server Action on submission (via `safeParse`),
- the OpenAPI types as a sanity cross-check once codegen is wired.

`ticket.ts` ships a `transitionSchema` whose `.refine()` enforces the **state machine** (`booked → checked_in → … → completed`, no skipping, no going back). The same `isAllowedTransition()` helper is used by the MSW handlers and the Server Action — one place owns the rule.

### Demo mode (MSW) — recruiter-friendly out of the box

In `src/mocks/handlers.ts` we mock the full Go API surface area: auth, tickets, vehicles, bookings, invoices, analytics. JWTs are signed with the same `jose` secret the middleware verifies, so **the auth flow looks and behaves exactly like the real backend.**

- **Browser**: `MswBoot` client component starts the worker before the app renders.
- **Server (SSR / Server Actions)**: `instrumentation.ts` calls `setupServer().listen()` once at boot.

Both gate on `NEXT_PUBLIC_DEMO_MODE === "true"`. Deploying the public demo with that env var set means the Vercel link is a fully interactive app — not a "needs backend" error.

### Deliberately minimal client state

Server state lives in TanStack Query (when used) or Server Component fetch results. UI state (modals, form drafts) uses local `useState`. **No Zustand, Redux, or Jotai.** If reviewers see a state library installed, they'll ask what client state genuinely required it — and the answer should be "none, in this app."

---

## Tradeoffs made

- **No NextAuth**. Faster to own a small JWT/cookie/middleware pattern than to learn and configure NextAuth, especially with a custom Go backend issuing tokens. Cost: we maintain ~80 lines of auth code instead of a library.
- **MSW in production-like demo mode**. Adds a service worker and an instrumentation hook, but pays for itself the first time a recruiter clicks the deploy link.
- **Hand-authored API types until the OpenAPI spec exists**. Keeps the FE buildable without the Go service. The contract gets pinned by codegen the moment the spec lands.
- **Staff routes live under `/dashboard/...`** instead of sharing URLs with customer routes. Necessary because Next.js route groups can't both define the same path; arguably better UX (staff and customer have different mental models for "ticket page" anyway).
- **WebSocket is stubbed in this iteration**. The hook and provider are in place; turning on the connection is a base-URL change once the WS endpoint exists.
- **Test coverage is targeted, not high**. We test the Zod state-machine refinement (the hardest bit of business logic) and one Playwright happy path. Adding more is cheap once the features land.

---

## What I'd add next

- **Parts inventory** — connect a parts table to ticket detail, gate `in_repair → ready_for_pickup` on parts available.
- **Payment processing** — Stripe Checkout link from the invoice page; webhook updates invoice paid-state.
- **SMS/WhatsApp notifications** — server-side triggers on `ready_for_pickup`. Twilio fits neatly into the existing audit log.
- **Multi-branch / multi-tenant** — adds an `org_id` everywhere; non-trivial schema change but a clean cut on the FE (org switcher in the layout).
- **Mechanic capacity planning** — assign tickets to bays and shifts; needs more product thinking than engineering.
- **Mobile** — a thin React Native client reusing `lib/api/client.ts` and the same Zod schemas.

---

## How to run locally

```bash
pnpm install
cp .env.example .env.local       # already done — see .env.local
pnpm dev                         # http://localhost:3000
```

Demo accounts (any password "password123"):

| Role              | Email                | Lands on     |
| ----------------- | -------------------- | ------------ |
| `customer`        | customer@example.com | `/tickets`   |
| `mechanic`        | mechanic@example.com | `/dashboard` |
| `service_advisor` | advisor@example.com  | `/dashboard` |
| `owner`           | owner@example.com    | `/dashboard` |

### Other useful scripts

```bash
pnpm build           # production build
pnpm start           # serve the production build
pnpm lint            # ESLint
pnpm format          # Prettier write
pnpm format:check    # Prettier check (CI-friendly)
pnpm test            # Vitest unit tests
pnpm test:watch      # Vitest watch mode
pnpm test:e2e        # Playwright (builds + boots the app, runs the smoke)
pnpm gen:api         # regen API types from openapi/pitstop.yaml (once the spec lands)
```
