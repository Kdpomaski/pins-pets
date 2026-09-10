import type { PinsData } from "@/lib/store";

const scoutId = "11111111-1111-4111-8111-111111111111";
const misoId = "22222222-2222-4222-8222-222222222222";
const now = () => new Date().toISOString();

/** Fresh install: demo pets only. Inventory starts empty — add a compound before logging. */
export const DEFAULT_DATA: PinsData = {
  pets: [
    {
      id: scoutId,
      name: "Scout",
      species: "dog",
      breed: "Mixed",
      weightKg: 22,
      sex: "male",
      color: "#d97706",
      updatedAt: now(),
    },
    {
      id: misoId,
      name: "Miso",
      species: "cat",
      breed: "Domestic shorthair",
      weightKg: 4.2,
      sex: "female",
      color: "#64748b",
      updatedAt: now(),
    },
  ],
  activePetId: scoutId,
  logs: [],
  inventory: [],
  schedule: [],
};
