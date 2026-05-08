import { z } from "zod";

export const SERVICE_TYPES = [
  "oil_change",
  "tire_rotation",
  "brake_service",
  "diagnostic",
  "general_inspection",
] as const;

export const serviceTypeSchema = z.enum(SERVICE_TYPES);
export type ServiceType = z.infer<typeof serviceTypeSchema>;

export const bookingSchema = z.object({
  vehicleId: z.string().min(1, "Select a vehicle"),
  serviceType: serviceTypeSchema,
  preferredSlot: z.iso
    .datetime({ message: "Pick a valid date and time" })
    .refine((value) => new Date(value).getTime() > Date.now(), {
      message: "Slot must be in the future",
    }),
  notes: z.string().max(1000).optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
