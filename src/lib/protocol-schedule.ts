import { defaultWeekdays } from '@/lib/schedule-export';
import type { InventoryItem, ScheduledDose } from '@/lib/store';

const DEFAULT_TIME = '08:00';

function compoundKey(petId: string | null | undefined, compound: string): string {
  return `${petId ?? 'none'}::${compound}`;
}

/** Upsert / deactivate calendar schedule rows when inventory protocol changes. */
export function syncScheduleWithInventory(
  schedule: ScheduledDose[],
  inventory: InventoryItem[],
  fallbackPetId?: string | null,
): ScheduledDose[] {
  const now = new Date().toISOString();
  const byKey = new Map<string, InventoryItem>();
  for (const item of inventory) {
    if (item.deletedAt) continue;
    const petId = item.petId ?? fallbackPetId ?? null;
    if (!petId) continue;
    const key = compoundKey(petId, item.name);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }
    if ((item.frequency || item.defaultDose != null) && !existing.frequency && existing.defaultDose == null) {
      byKey.set(key, item);
    }
  }

  const next = [...schedule];
  const seen = new Set<string>();

  for (const [key, item] of byKey) {
    const petId = item.petId ?? fallbackPetId;
    if (!petId) continue;
    const freq = item.frequency?.trim();
    const dose = item.defaultDose;
    if (!freq || dose == null || dose <= 0) continue;
    if (freq.toLowerCase() === 'as needed') continue;

    seen.add(key);
    const days = defaultWeekdays(freq);
    const idx = next.findIndex(
      (s) => s.petId === petId && s.compound === item.name && !s.deletedAt,
    );
    if (idx >= 0) {
      const prev = next[idx];
      next[idx] = {
        ...prev,
        dose,
        unit: item.unit,
        medType: item.medType ?? prev.medType,
        days,
        time: prev.time || DEFAULT_TIME,
        active: true,
        deletedAt: null,
        updatedAt: now,
      };
    } else {
      next.push({
        id: crypto.randomUUID(),
        petId,
        compound: item.name,
        medType: item.medType,
        dose,
        unit: item.unit,
        time: DEFAULT_TIME,
        days,
        active: true,
        updatedAt: now,
        deletedAt: null,
      });
    }
  }

  return next.map((s) => {
    if (s.deletedAt) return s;
    const key = compoundKey(s.petId, s.compound);
    if (seen.has(key)) return s;
    if (byKey.has(key) && s.active) {
      return { ...s, active: false, updatedAt: now };
    }
    return s;
  });
}
