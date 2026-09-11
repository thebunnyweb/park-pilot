import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Enter your name").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters").max(200),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const travellerSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  birthdate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  heightInInches: z.coerce.number().int().min(10).max(90).nullable().optional(),
  thrillTolerance: z.enum(["low", "medium", "high"]).default("medium"),
  needsMiddayBreak: z.boolean().default(false),
  mobilityNotes: z.string().max(300).optional().nullable(),
});
export type TravellerInput = z.infer<typeof travellerSchema>;
export type TravellerFormInput = z.input<typeof travellerSchema>;

export const secondParkSchema = z.object({
  parkId: z.number().int().positive(),
  parkName: z.string().min(1),
  switchTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const plannerInputSchema = z.object({
  parkId: z.number().int().positive(),
  parkName: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  arrival: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  departure: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  travellerIds: z.array(z.string()).min(1, "Pick at least one traveller"),
  mustDoRideIds: z.array(z.number().int()).default([]),
  skipRideIds: z.array(z.number().int()).default([]),
  laneStrategy: z.enum(["none", "multi", "multi_plus_single"]).default("multi"),
  middayBreak: z.boolean().default(true),
  notes: z.string().max(500).optional(),
  secondPark: secondParkSchema.optional(),
  tripDayId: z.string().optional(),
  searchEnabled: z.boolean().default(false),
});
export type PlannerFormInput = z.infer<typeof plannerInputSchema>;

export const refineSchema = z.object({
  planId: z.string().optional(),
  instruction: z.string().min(3).max(400),
  itinerary: z.any(),
  input: z.any(),
});

export function ageYears(birthdate: Date | string, on: Date | string = new Date()): number {
  const b = new Date(birthdate);
  const d = new Date(on);
  let age = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) age--;
  return Math.max(0, age);
}
