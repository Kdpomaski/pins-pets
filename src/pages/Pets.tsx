import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { usePinsStore, type Pet } from "@/lib/store";
import { SPECIES_LABELS, type Species } from "@/lib/body-map-data";
import { PinsPetsHeader, PetSwitcher } from "@/components/Brand";

const COLORS = ["#d97706", "#64748b", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#ef4444"];

export default function Pets() {
  const { data, activePet, addPet, updatePet, deletePet, setActivePet } = usePinsStore();
  const [adding, setAdding] = useState(data.pets.length === 0);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species>("dog");
  const [breed, setBreed] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [sex, setSex] = useState<Pet["sex"]>("unknown");
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState("");

  const handleAdd = () => {
    const weight = weightKg ? Number(weightKg) : undefined;
    const result = addPet({
      name: name.trim(),
      species,
      breed: breed.trim() || undefined,
      weightKg: weight && Number.isFinite(weight) ? weight : undefined,
      sex,
      color,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName("");
    setBreed("");
    setWeightKg("");
    setError("");
    setAdding(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <PinsPetsHeader />
          <PetSwitcher />
        </header>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Pets</h1>
          <button
            onClick={() => setAdding(true)}
            className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center"
            aria-label="Add pet"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {data.pets.map((pet) => (
            <div
              key={pet.id}
              className={`bg-card border rounded-2xl p-4 ${
                pet.id === activePet?.id ? "border-primary" : "border-border"
              }`}
            >
              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActivePet(pet.id)}
                  className="text-left min-w-0 flex-1"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: pet.color }}
                    />
                    <h3 className="font-semibold truncate">{pet.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {SPECIES_LABELS[pet.species]}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                    {pet.weightKg ? ` · ${pet.weightKg} kg` : ""}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove ${pet.name}? Logs for this pet will be deleted.`)) {
                      deletePet(pet.id);
                    }
                  }}
                  className="text-muted-foreground hover:text-destructive p-2"
                  aria-label={`Delete ${pet.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <label className="mt-3 block text-xs text-muted-foreground">
                Weight (kg)
                <input
                  type="number"
                  step="any"
                  value={pet.weightKg ?? ""}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updatePet(pet.id, {
                      weightKg: Number.isFinite(val) && val > 0 ? val : undefined,
                    });
                  }}
                  className="mt-1 w-full bg-input/50 border border-border rounded-lg p-2 text-sm text-foreground"
                />
              </label>
            </div>
          ))}
        </div>

        {adding && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold">Add a pet</h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full bg-input/50 border border-border rounded-lg p-3"
            />
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value as Species)}
              className="w-full bg-input/50 border border-border rounded-lg p-3"
            >
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="other">Other pet</option>
            </select>
            <input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="Breed (optional)"
              className="w-full bg-input/50 border border-border rounded-lg p-3"
            />
            <input
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="Weight in kg (optional)"
              type="number"
              step="any"
              className="w-full bg-input/50 border border-border rounded-lg p-3"
            />
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as Pet["sex"])}
              className="w-full bg-input/50 border border-border rounded-lg p-3"
            >
              <option value="unknown">Sex unknown</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${
                    color === c ? "border-foreground" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 bg-primary text-primary-foreground font-semibold rounded-xl py-3"
              >
                Save pet
              </button>
              {data.pets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="px-4 border border-border rounded-xl"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
