import type { WeightUnit } from "@/lib/weight";

export function WeightUnitToggle({
  unit,
  onChange,
}: {
  unit: WeightUnit;
  onChange: (unit: WeightUnit) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Weight unit"
      className="inline-flex rounded-full border border-border overflow-hidden"
    >
      {(["lb", "kg"] as const).map((option) => {
        const selected = unit === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={`px-2.5 py-0.5 text-xs font-semibold ${
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
