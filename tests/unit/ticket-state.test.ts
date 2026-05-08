import { describe, expect, it } from "vitest";
import { isAllowedTransition, transitionSchema } from "@/lib/schemas/ticket";

describe("ticket state machine", () => {
  it("allows the canonical forward path", () => {
    expect(isAllowedTransition("booked", "checked_in")).toBe(true);
    expect(isAllowedTransition("in_repair", "ready_for_pickup")).toBe(true);
  });

  it("rejects skipping states", () => {
    expect(isAllowedTransition("booked", "in_repair")).toBe(false);
  });

  it("rejects backward transitions", () => {
    expect(isAllowedTransition("ready_for_pickup", "in_repair")).toBe(false);
  });

  it("rejects any transition out of completed", () => {
    expect(isAllowedTransition("completed", "booked")).toBe(false);
    expect(isAllowedTransition("completed", "ready_for_pickup")).toBe(false);
  });

  it("transitionSchema enforces the same rules", () => {
    const ok = transitionSchema.safeParse({
      from: "diagnosing",
      to: "in_repair",
    });
    expect(ok.success).toBe(true);

    const bad = transitionSchema.safeParse({
      from: "booked",
      to: "completed",
    });
    expect(bad.success).toBe(false);
  });
});
