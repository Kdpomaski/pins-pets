import { z } from "zod";

export const speciesSchema = z.enum(["dog", "cat", "other"]);
export const medTypeSchema = z.enum([
  "injection",
  "oral",
  "topical",
  "vaccine",
  "insulin",
  "other",
]);
export const medFormSchema = z.enum([
  "vial",
  "tablet",
  "chew",
  "topical",
  "insulin",
  "vaccine",
  "liquid",
]);
export const doseUnitSchema = z.enum([
  "mg",
  "mcg",
  "ml",
  "IU",
  "tablet",
  "chew",
  "drop",
  "pump",
]);
export const petSexSchema = z.enum(["male", "female", "unknown"]);

export const petSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  species: speciesSchema,
  breed: z.string().trim().max(80).optional(),
  weightKg: z.number().positive().finite().max(500).optional(),
  sex: petSexSchema.optional(),
  birthdate: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  notes: z.string().max(500).optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export const injectionLogSchema = z.object({
  id: z.string().uuid(),
  petId: z.string().uuid(),
  medType: medTypeSchema,
  siteId: z.string().min(1).max(80).optional(),
  compound: z.string().trim().min(1).max(120),
  dose: z.number().positive().finite(),
  unit: doseUnitSchema,
  timestamp: z.string().datetime(),
  notes: z.string().max(500).optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export const inventoryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  form: medFormSchema.default("vial"),
  petId: z.string().uuid().nullable().optional(),
  concentration: z.number().positive().finite().optional(),
  totalVolume: z.number().positive().finite(),
  remainingVolume: z.number().min(0).finite(),
  unit: doseUnitSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  frequency: z.string().trim().max(40).optional(),
  defaultDose: z.number().positive().finite().optional(),
  medType: medTypeSchema.optional(),
  reconstitutedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export const scheduledDoseSchema = z.object({
  id: z.string().uuid(),
  petId: z.string().uuid(),
  compound: z.string().trim().min(1).max(120),
  medType: medTypeSchema.optional(),
  dose: z.number().positive().finite(),
  unit: doseUnitSchema,
  time: z.string().regex(/^\d{2}:\d{2}$/),
  days: z.array(z.number().int().min(0).max(6)),
  active: z.boolean(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export const pinsDataSchema = z.object({
  pets: z.array(petSchema),
  activePetId: z.string().uuid().nullable(),
  logs: z.array(injectionLogSchema),
  inventory: z.array(inventoryItemSchema),
  schedule: z.array(scheduledDoseSchema),
});

export const newPetSchema = petSchema.omit({
  id: true,
  updatedAt: true,
  deletedAt: true,
});

export const newInjectionLogSchema = injectionLogSchema.omit({
  id: true,
  updatedAt: true,
  deletedAt: true,
});

export const newInventoryItemSchema = inventoryItemSchema.omit({
  id: true,
  updatedAt: true,
  deletedAt: true,
});

export type NewInjectionLog = z.infer<typeof newInjectionLogSchema>;
export type NewInventoryItem = z.infer<typeof newInventoryItemSchema>;
export type NewPet = z.infer<typeof newPetSchema>;

export function formatZodError(error: z.ZodError): string {
  return error.errors.map((e) => e.message).join(". ");
}
