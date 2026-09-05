export type WeightUnit = "kg" | "lb";

/** International avoirdupois pound. */
export const KG_PER_LB = 0.45359237;
export const LB_PER_KG = 1 / KG_PER_LB;

export function isWeightUnit(value: unknown): value is WeightUnit {
  return value === "kg" || value === "lb";
}

/** Canonical storage is always kilograms. */
export function toKg(value: number, unit: WeightUnit): number {
  if (unit === "kg") return value;
  return value * KG_PER_LB;
}

export function fromKg(kg: number, unit: WeightUnit): number {
  if (unit === "kg") return kg;
  return kg * LB_PER_KG;
}

export function formatWeightNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}

export function formatWeightDisplay(kg: number, unit: WeightUnit): string {
  return `${formatWeightNumber(fromKg(kg, unit))} ${unit}`;
}

/** Parse a typed weight; returns canonical kg or undefined if empty/invalid. */
export function parseWeightToKg(raw: string, unit: WeightUnit): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return toKg(value, unit);
}
