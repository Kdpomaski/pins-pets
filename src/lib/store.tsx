import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_DATA } from "@/lib/default-data";
import { getDeviceId } from "@/lib/device";
import {
  newInjectionLogSchema,
  newInventoryItemSchema,
  newPetSchema,
  pinsDataSchema,
  formatZodError,
} from "@/lib/schemas";
import { useSecurity } from "@/lib/security-context";
import { buildSyncEnvelope } from "@/lib/sync";
import { bootstrapPinsData, saveEncrypted, saveWithDeviceKey } from "@/lib/storage";
import {
  deductVolumeFromCompound,
  scheduleForRemainingInventory,
} from "@/lib/inventory-vials";
import type { Species } from "@/lib/body-map-data";

export type MedType = "injection" | "oral" | "topical" | "vaccine" | "insulin" | "other";
export type MedForm = "vial" | "tablet" | "chew" | "topical" | "insulin" | "vaccine" | "liquid";
export type DoseUnit = "mg" | "mcg" | "ml" | "IU" | "tablet" | "chew" | "drop" | "pump";

export type Pet = {
  id: string;
  name: string;
  species: Species;
  breed?: string;
  weightKg?: number;
  sex?: "male" | "female" | "unknown";
  birthdate?: string;
  color: string;
  notes?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type InjectionLog = {
  id: string;
  petId: string;
  medType: MedType;
  siteId?: string;
  compound: string;
  dose: number;
  unit: DoseUnit;
  timestamp: string;
  notes?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type InventoryItem = {
  id: string;
  name: string;
  form: MedForm;
  petId?: string | null;
  concentration?: number;
  totalVolume: number;
  remainingVolume: number;
  unit: DoseUnit;
  color: string;
  frequency?: string;
  defaultDose?: number;
  medType?: MedType;
  reconstitutedAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type ScheduledDose = {
  id: string;
  petId: string;
  compound: string;
  medType?: MedType;
  dose: number;
  unit: DoseUnit;
  time: string;
  days: number[];
  active: boolean;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type PinsData = {
  pets: Pet[];
  activePetId: string | null;
  logs: InjectionLog[];
  inventory: InventoryItem[];
  schedule: ScheduledDose[];
};

export { DEFAULT_DATA };

type PinsStoreContextType = {
  data: PinsData;
  ready: boolean;
  activePet: Pet | null;
  setActivePet: (id: string) => void;
  addPet: (pet: Omit<Pet, "id" | "updatedAt">) => { ok: true; id: string } | { ok: false; error: string };
  updatePet: (id: string, updates: Partial<Pet>) => void;
  deletePet: (id: string) => void;
  addLog: (log: Omit<InjectionLog, "id" | "updatedAt">) => { ok: true } | { ok: false; error: string };
  updateInventory: (id: string, updates: Partial<InventoryItem>) => void;
  addInventoryItem: (
    item: Omit<InventoryItem, "id" | "updatedAt">,
  ) => { ok: true } | { ok: false; error: string };
  deleteInventoryItem: (id: string) => void;
};

const PinsStoreContext = createContext<PinsStoreContextType | null>(null);

export function PinsProvider({ children }: { children: ReactNode }) {
  const { cryptoKey, encryptionMode, status } = useSecurity();
  const [data, setData] = useState<PinsData>(DEFAULT_DATA);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "ready" || !cryptoKey) return;

    let cancelled = false;
    (async () => {
      const loaded = await bootstrapPinsData(cryptoKey);
      if (!cancelled) {
        setData(normalizeData(loaded));
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, cryptoKey]);

  const persist = useCallback(
    (next: PinsData) => {
      const parsed = pinsDataSchema.safeParse(next);
      if (!parsed.success) return;

      const envelope = buildSyncEnvelope(getDeviceId(), parsed.data);

      const run = async () => {
        if (encryptionMode === "passphrase" && cryptoKey) {
          await saveEncrypted(envelope, cryptoKey);
        } else {
          await saveWithDeviceKey(envelope);
        }
      };
      void run();
    },
    [cryptoKey, encryptionMode],
  );

  useEffect(() => {
    if (!ready) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(data), 400);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, ready, persist]);

  const activePet = useMemo(
    () => data.pets.find((p) => p.id === data.activePetId) ?? data.pets[0] ?? null,
    [data.pets, data.activePetId],
  );

  const setActivePet = (id: string) => {
    setData((prev) => ({ ...prev, activePetId: id }));
  };

  const addPet = (pet: Omit<Pet, "id" | "updatedAt">) => {
    const parsed = newPetSchema.safeParse(pet);
    if (!parsed.success) return { ok: false as const, error: formatZodError(parsed.error) };
    const id = crypto.randomUUID();
    const next: Pet = { ...parsed.data, id, updatedAt: new Date().toISOString() };
    setData((prev) => ({
      ...prev,
      pets: [...prev.pets, next],
      activePetId: prev.activePetId ?? id,
    }));
    return { ok: true as const, id };
  };

  const updatePet = (id: string, updates: Partial<Pet>) => {
    setData((prev) => ({
      ...prev,
      pets: prev.pets.map((p) =>
        p.id === id ? { ...p, ...updates, id: p.id, updatedAt: new Date().toISOString() } : p,
      ),
    }));
  };

  const deletePet = (id: string) => {
    setData((prev) => {
      const pets = prev.pets.filter((p) => p.id !== id);
      const activePetId =
        prev.activePetId === id ? (pets[0]?.id ?? null) : prev.activePetId;
      return {
        ...prev,
        pets,
        activePetId,
        logs: prev.logs.filter((l) => l.petId !== id),
        schedule: prev.schedule.filter((s) => s.petId !== id),
        inventory: prev.inventory.map((item) =>
          item.petId === id ? { ...item, petId: null } : item,
        ),
      };
    });
  };

  const addLog = (log: Omit<InjectionLog, "id" | "updatedAt">) => {
    const parsed = newInjectionLogSchema.safeParse(log);
    if (!parsed.success) return { ok: false as const, error: formatZodError(parsed.error) };

    const now = new Date().toISOString();
    const newLog: InjectionLog = { ...parsed.data, id: crypto.randomUUID(), updatedAt: now };

    setData((prev) => {
      const inventory = deductVolumeFromCompound(
        prev.inventory,
        newLog.compound,
        newLog.dose,
        newLog.unit,
        now,
      );

      return {
        ...prev,
        logs: [newLog, ...prev.logs].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
        inventory,
        schedule: scheduleForRemainingInventory(prev.schedule, inventory),
      };
    });

    return { ok: true as const };
  };

  const updateInventory = (id: string, updates: Partial<InventoryItem>) => {
    setData((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item,
      ),
    }));
  };

  const addInventoryItem = (item: Omit<InventoryItem, "id" | "updatedAt">) => {
    const parsed = newInventoryItemSchema.safeParse(item);
    if (!parsed.success) return { ok: false as const, error: formatZodError(parsed.error) };

    setData((prev) => ({
      ...prev,
      inventory: [
        ...prev.inventory,
        { ...parsed.data, id: crypto.randomUUID(), updatedAt: new Date().toISOString() },
      ],
    }));
    return { ok: true as const };
  };

  const deleteInventoryItem = (id: string) => {
    setData((prev) => {
      const item = prev.inventory.find((entry) => entry.id === id);
      if (!item) return prev;

      const remainingVials = prev.inventory.filter(
        (entry) => entry.name === item.name && entry.id !== id,
      );

      return {
        ...prev,
        inventory: prev.inventory.filter((entry) => entry.id !== id),
        schedule:
          remainingVials.length === 0
            ? prev.schedule.filter((dose) => dose.compound !== item.name)
            : prev.schedule,
      };
    });
  };

  if (!ready) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground text-sm">
        Loading encrypted data…
      </div>
    );
  }

  return (
    <PinsStoreContext.Provider
      value={{
        data,
        ready,
        activePet,
        setActivePet,
        addPet,
        updatePet,
        deletePet,
        addLog,
        updateInventory,
        addInventoryItem,
        deleteInventoryItem,
      }}
    >
      {children}
    </PinsStoreContext.Provider>
  );
}

export const usePinsStore = () => {
  const context = useContext(PinsStoreContext);
  if (!context) throw new Error("usePinsStore must be used within PinsProvider");
  return context;
};

export function inventoryForPet(inventory: InventoryItem[], petId: string | null) {
  return inventory.filter((item) => !item.petId || item.petId === petId);
}

function normalizeData(raw: PinsData): PinsData {
  const pets = raw.pets?.length ? raw.pets : DEFAULT_DATA.pets;
  const activePetId =
    raw.activePetId && pets.some((p) => p.id === raw.activePetId)
      ? raw.activePetId
      : pets[0]?.id ?? null;
  const fallbackPetId = activePetId ?? pets[0]?.id ?? DEFAULT_DATA.pets[0].id;

  return {
    pets,
    activePetId,
    logs: (raw.logs ?? []).map((log) => ({
      ...log,
      petId: log.petId || fallbackPetId,
      medType: log.medType || "injection",
    })),
    inventory: (raw.inventory ?? []).map((item) => ({
      ...item,
      form: item.form || "vial",
    })),
    schedule: (raw.schedule ?? []).map((dose) => ({
      ...dose,
      petId: dose.petId || fallbackPetId,
    })),
  };
}
