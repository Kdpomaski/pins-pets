import { Link } from "wouter";
import { PawPrint } from "lucide-react";
import { usePinsStore } from "@/lib/store";
import { SPECIES_LABELS } from "@/lib/body-map-data";

/** Same Pins “P” (stem, bowl, needle, orange tip), drawn in the original 40×46 space. */
function PinsLetter() {
  return (
    <>
      <rect x="12" y="11" width="3.5" height="23" rx="0.4" fill="white" />
      <path d="M 15.5,11 C 15.5,11 28,11 28,18.5 C 28,26 15.5,26 15.5,26 Z" fill="white" />
      <path d="M 16.5,13.5 C 16.5,13.5 25,13.5 25,18.5 C 25,23.5 16.5,23.5 16.5,23.5 Z" fill="#111" />
      <path d="M 13,32 L 16.5,32 L 14.75,42 Z" fill="white" />
      <circle cx="14.75" cy="43" r="1.4" fill="#E85D04" />
    </>
  );
}

export function PinsPetsLogoIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 48" fill="none" aria-hidden="true">
      <ellipse cx="7.5" cy="12.4" rx="4.5" ry="5.7" fill="#111" stroke="#E85D04" strokeWidth="1.9" />
      <ellipse cx="15.2" cy="7.1" rx="4.7" ry="5.9" fill="#111" stroke="#E85D04" strokeWidth="1.9" />
      <ellipse cx="24.8" cy="7.1" rx="4.7" ry="5.9" fill="#111" stroke="#E85D04" strokeWidth="1.9" />
      <ellipse cx="32.5" cy="12.4" rx="4.5" ry="5.7" fill="#111" stroke="#E85D04" strokeWidth="1.9" />

      <path
        d="M20 21.4C11.2 21.4 5.2 27.2 5.5 35.6C5.8 43.6 11.6 48.2 20 48.2C28.4 48.2 34.2 43.6 34.5 35.6C34.8 27.2 28.8 21.4 20 21.4Z"
        fill="#111"
        stroke="#E85D04"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />

      <g transform="translate(6.6, 13.1) scale(0.70)">
        <PinsLetter />
      </g>
    </svg>
  );
}

export function PinsPetsHeader() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <PinsPetsLogoIcon size={38} />
      <div className="leading-none">
        <div className="flex items-baseline gap-[1px]">
          <span className="text-[22px] font-black text-foreground tracking-tight leading-none">P</span>
          <span className="text-[22px] font-black tracking-tight leading-none" style={{ color: "#E85D04" }}>
            i
          </span>
          <span className="text-[22px] font-black text-foreground tracking-tight leading-none">ns</span>
        </div>
        <p className="text-[10px] text-muted-foreground tracking-widest uppercase leading-none mt-0.5">
          Pets · med tracker
        </p>
      </div>
    </Link>
  );
}

export function PetSwitcher() {
  const { data, activePet, setActivePet } = usePinsStore();

  if (data.pets.length === 0) {
    return (
      <Link
        href="/pets"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
      >
        <PawPrint size={14} className="text-primary" />
        Add a pet
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={activePet?.id ?? ""}
        onChange={(e) => setActivePet(e.target.value)}
        className="bg-card border border-border rounded-full px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Active pet"
      >
        {data.pets.map((pet) => (
          <option key={pet.id} value={pet.id}>
            {pet.name} · {SPECIES_LABELS[pet.species]}
          </option>
        ))}
      </select>
      <Link
        href="/pets"
        className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-primary"
        aria-label="Manage pets"
      >
        <PawPrint size={14} />
      </Link>
    </div>
  );
}
