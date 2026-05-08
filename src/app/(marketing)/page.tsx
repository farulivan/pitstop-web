import Link from "next/link";
import { CalendarClock, ClipboardList, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: CalendarClock,
    title: "Book in seconds",
    body: "Pick a slot, drop in vehicle details, and we handle the rest.",
  },
  {
    icon: Wrench,
    title: "Live repair status",
    body: "Watch your ticket move from check-in to ready-for-pickup in real time.",
  },
  {
    icon: ClipboardList,
    title: "Full service history",
    body: "Every ticket, every audit entry, every invoice — kept per vehicle.",
  },
];

export default function MarketingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-8 px-6 py-24 sm:py-32">
        <span className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
          Pitstop
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          The auto service ticket system your bay actually runs on.
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Customer bookings, mechanic dashboards, live status updates, and a
          clean audit trail — in one place.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/book">Book a service</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="border-border border-t">
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-16 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="border-border bg-card flex flex-col gap-3 rounded-lg border p-6"
            >
              <Icon className="text-primary size-6" />
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-muted-foreground text-sm">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
