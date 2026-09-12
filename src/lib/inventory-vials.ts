import type { DoseUnit, InventoryItem } from "@/lib/store";

export const DEPLETED_THRESHOLD_ML = 0.001;

export function isVialActive(item: InventoryItem): boolean {
  return item.remainingVolume > DEPLETED_THRESHOLD_ML;
}

/** Active items first; FIFO by reconstitution date (unreconstituted vials queue last). */
export function sortVialsForCompound(vials: InventoryItem[]): InventoryItem[] {
  return [...vials].sort((a, b) => {
    const aActive = isVialActive(a);
    const bActive = isVialActive(b);
    if (aActive !== bActive) return aActive ? -1 : 1;

    const aDate = a.reconstitutedAt ? new Date(a.reconstitutedAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.reconstitutedAt ? new Date(b.reconstitutedAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aDate - bDate;
  });
}

export function removeDepletedVials(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter(isVialActive);
}

function toItemUnits(dose: number, doseUnit: DoseUnit, itemUnit: DoseUnit): number {
  if (doseUnit === itemUnit) return dose;
  if (itemUnit === "mg" && doseUnit === "mcg") return dose / 1000;
  if (itemUnit === "mcg" && doseUnit === "mg") return dose * 1000;
  return dose;
}

export function restoreVolumeToCompound(
  inventory: InventoryItem[],
  compound: string,
  dose: number,
  doseUnit: DoseUnit,
  now: string,
): InventoryItem[] {
  const compoundVials = inventory.filter((v) => v.name === compound);
  const target = sortVialsForCompound(compoundVials)[0];
  if (!target) return inventory;

  const doseInItemUnits = toItemUnits(dose, doseUnit, target.unit);
  let restored = doseInItemUnits;
  if (target.form === "vial" && target.concentration) {
    restored = doseInItemUnits / target.concentration;
  }

  return inventory.map((item) => {
    if (item.id !== target.id) return item;
    return {
      ...item,
      remainingVolume: item.remainingVolume + restored,
      updatedAt: now,
    };
  });
}

export function deductVolumeFromCompound(
  inventory: InventoryItem[],
  compound: string,
  dose: number,
  doseUnit: DoseUnit,
  now: string,
): InventoryItem[] {
  const compoundVials = sortVialsForCompound(inventory.filter((v) => v.name === compound));
  const target = compoundVials.find(isVialActive);
  if (!target) return inventory;

  const doseInItemUnits = toItemUnits(dose, doseUnit, target.unit);
  let used = doseInItemUnits;
  if (target.form === "vial" && target.concentration) {
    used = doseInItemUnits / target.concentration;
  }

  const updated = inventory.map((item) => {
    if (item.id !== target.id) return item;
    return {
      ...item,
      remainingVolume: Math.max(0, item.remainingVolume - used),
      updatedAt: now,
    };
  });

  return removeDepletedVials(updated);
}

export function scheduleForRemainingInventory<T extends { compound: string }>(
  schedule: T[],
  inventory: InventoryItem[],
): T[] {
  const compounds = new Set(inventory.map((v) => v.name));
  return schedule.filter((dose) => compounds.has(dose.compound));
}

/** Default vial/item count when creating inventory as a kit. */
export const DEFAULT_KIT_VIAL_COUNT = 10;

/** Inclusive max kit size for the create form. */
export const MAX_KIT_VIAL_COUNT = 50;

export function clampKitVialCount(raw: number): number {
  if (!Number.isFinite(raw)) return DEFAULT_KIT_VIAL_COUNT;
  return Math.min(MAX_KIT_VIAL_COUNT, Math.max(1, Math.floor(raw)));
}

/**
 * Expand a single inventory template into N payloads.
 * First vial of a new compound keeps reconstitutedAt; extras are unreconstituted.
 */
export function expandKitInventoryItems<T extends { reconstitutedAt?: string }>(
  template: T,
  count: number,
): T[] {
  const n = clampKitVialCount(count);
  return Array.from({ length: n }, (_, index) => {
    if (index === 0) return { ...template };
    const { reconstitutedAt: _omit, ...rest } = template;
    return rest as T;
  });
}
