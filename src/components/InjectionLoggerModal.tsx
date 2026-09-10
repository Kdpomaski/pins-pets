import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, MapPin, Clock } from "lucide-react";
import {
  usePinsStore,
  inventoryForPet,
  type DoseUnit,
  type MedType,
  type InventoryItem,
  type InjectionLog,
} from "@/lib/store";
import { SPECIES_SITES, siteById, siteLabel } from "@/lib/body-map-data";
import { useEntitlementsOptional } from "@/lib/billing/entitlement-context";
import { doseVolumeMl } from "@/lib/dose-volume";

type InjectionLoggerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultSiteId?: string | null;
  defaultCompoundName?: string | null;
  editLog?: InjectionLog | null;
};

const MED_TYPES: { id: MedType; label: string }[] = [
  { id: "injection", label: "Injection" },
  { id: "oral", label: "Oral" },
  { id: "topical", label: "Topical" },
  { id: "insulin", label: "Insulin" },
  { id: "vaccine", label: "Vaccine" },
  { id: "other", label: "Other" },
];

function needsSite(medType: MedType) {
  return medType === "injection" || medType === "insulin" || medType === "vaccine" || medType === "topical";
}

function compoundsByUsage(
  inventory: InventoryItem[],
  logs: { compound: string }[],
): InventoryItem[] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    counts.set(log.compound, (counts.get(log.compound) ?? 0) + 1);
  }

  const seen = new Set<string>();
  const unique = inventory.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });

  return unique.sort((a, b) => {
    const diff = (counts.get(b.name) ?? 0) - (counts.get(a.name) ?? 0);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return toDatetimeLocalValue(new Date().toISOString());
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function InjectionLoggerModal({
  isOpen,
  onClose,
  defaultSiteId,
  defaultCompoundName,
  editLog,
}: InjectionLoggerModalProps) {
  const { data, activePet, addLog, updateLog } = usePinsStore();
  const entitlements = useEntitlementsOptional();
  const petInventory = useMemo(
    () => inventoryForPet(data.inventory, activePet?.id ?? null),
    [data.inventory, activePet?.id],
  );
  const petLogs = useMemo(
    () => data.logs.filter((l) => l.petId === activePet?.id),
    [data.logs, activePet?.id],
  );

  const compoundOptions = useMemo(
    () => compoundsByUsage(petInventory, petLogs),
    [petInventory, petLogs],
  );

  const [siteId, setSiteId] = useState(defaultSiteId ?? "");
  const [compound, setCompound] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState<DoseUnit>("mg");
  const [medType, setMedType] = useState<MedType>("injection");
  const [notes, setNotes] = useState("");
  const [when, setWhen] = useState(() => toDatetimeLocalValue(new Date().toISOString()));
  const [error, setError] = useState("");

  const editing = Boolean(editLog);
  const quickMode = Boolean(defaultSiteId) && !editing;
  const sites = SPECIES_SITES[activePet?.species ?? "dog"];
  const selectedSite = sites.find((s) => s.id === siteId) ?? (siteId ? { id: siteId, label: siteLabel(siteId) } : undefined);

  const lastInjectionLabel = useMemo(() => {
    if (!siteId) return null;
    const relevant = petLogs.filter((log) => {
      if (editing && log.id === editLog?.id) return false;
      if (log.siteId !== siteId) return false;
      if (compound) return log.compound === compound;
      return true;
    });
    if (relevant.length === 0) return null;
    const latest = relevant.reduce((a, b) =>
      new Date(b.timestamp).getTime() > new Date(a.timestamp).getTime() ? b : a,
    );
    return format(new Date(latest.timestamp), "MMM d, yyyy");
  }, [siteId, compound, petLogs, editing, editLog?.id]);

  const applyCompound = (name: string) => {
    setCompound(name);
    const item = petInventory.find((i) => i.name === name);
    if (item) {
      setUnit(item.unit);
      setDose(item.defaultDose != null ? String(item.defaultDose) : "");
      if (item.medType) setMedType(item.medType);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setError("");

    if (editLog) {
      setSiteId(editLog.siteId ? (siteById(editLog.siteId)?.id ?? editLog.siteId) : "");
      setCompound(editLog.compound);
      setDose(String(editLog.dose));
      setUnit(editLog.unit);
      setMedType(editLog.medType);
      setNotes(editLog.notes ?? "");
      setWhen(toDatetimeLocalValue(editLog.timestamp));
      return;
    }

    setSiteId(defaultSiteId ?? "");
    setNotes("");
    setWhen(toDatetimeLocalValue(new Date().toISOString()));

    if (defaultCompoundName) {
      applyCompound(defaultCompoundName);
    } else if (compoundOptions.length > 0) {
      applyCompound(compoundOptions[0].name);
    } else {
      setCompound("");
      setDose("");
      setUnit("mg");
      setMedType(defaultSiteId ? "injection" : "oral");
    }
  }, [isOpen, defaultSiteId, defaultCompoundName, compoundOptions, editLog]); // eslint-disable-line react-hooks/exhaustive-deps

  const inventoryHasCompound = compoundOptions.some((item) => item.name === compound);
  const compoundChoices =
    editing && compound && !inventoryHasCompound
      ? [{ name: compound } as InventoryItem, ...compoundOptions]
      : compoundOptions;

  const handleSave = () => {
    if (!activePet) {
      setError("Add a pet first.");
      return;
    }
    if (needsSite(medType) && !siteId) {
      setError("Tap a location on the body map, or pick a site.");
      return;
    }
    if (!compound || !dose) {
      setError("Select a medication and enter a dose.");
      return;
    }
    if (!editing && !inventoryHasCompound) {
      setError("Add this medication in Inventory before logging a dose.");
      return;
    }
    if (editing && compound !== editLog?.compound && !inventoryHasCompound) {
      setError("Switch to a medication that is in Inventory.");
      return;
    }

    const doseNum = Number(dose);
    if (!Number.isFinite(doseNum) || doseNum <= 0) {
      setError("Dose must be a positive number.");
      return;
    }

    const timestamp = fromDatetimeLocalValue(when) ?? new Date().toISOString();
    const payload = {
      petId: activePet.id,
      medType,
      siteId: siteId || undefined,
      compound,
      dose: doseNum,
      unit,
      timestamp,
      notes: notes.trim() || undefined,
    };

    const result = editing && editLog
      ? updateLog(editLog.id, payload)
      : addLog(payload);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (!editing) {
      entitlements?.maybeShowSoftPaywallAfterFirstLog(data.logs.length);
    }
    onClose();
  };

  const canSave = Boolean(
    activePet &&
      compound &&
      dose &&
      (!needsSite(medType) || siteId) &&
      (editing || compoundOptions.length > 0),
  );

  const selectedItem = petInventory.find((item) => item.name === compound);
  const drawnVolume = doseVolumeMl({
    dose: dose ? Number(dose) : undefined,
    doseUnit: unit,
    concentration: selectedItem?.concentration,
    concentrationUnit: selectedItem?.unit ?? unit,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-border rounded-t-3xl max-w-md mx-auto shadow-2xl px-5 pt-5 pb-safe max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-5">
              <div className="min-w-0 flex-1 pr-3">
                {quickMode && selectedSite ? (
                  <>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Log for {activePet?.name ?? "pet"}
                    </p>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mt-1">
                      <MapPin size={22} className="text-primary shrink-0" />
                      <span className="truncate">{selectedSite.label}</span>
                    </h2>
                    <p className="text-base text-muted-foreground mt-2 flex items-center gap-1.5">
                      <Clock size={16} className="shrink-0" />
                      {lastInjectionLabel
                        ? `Last here: ${lastInjectionLabel}`
                        : "No prior dose here"}
                    </p>
                  </>
                ) : (
                  <h2 className="text-2xl font-bold text-foreground">
                    {editing ? "Edit dose" : "Quick log"}
                    {activePet ? ` · ${activePet.name}` : ""}
                  </h2>
                )}
              </div>
              <button
                onClick={onClose}
                data-pins-overlay-dismiss
                className="p-3 text-foreground bg-secondary/60 rounded-full shrink-0"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {MED_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMedType(t.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    medType === t.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {(!quickMode && needsSite(medType)) && (
              <div className="mb-5">
                <label className="text-sm font-semibold text-muted-foreground block mb-2">
                  Site
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full bg-input/50 border-2 border-border rounded-xl p-4 text-lg text-foreground focus:ring-2 focus:ring-primary focus:outline-none appearance-none"
                >
                  <option value="">Tap body map or select site…</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.label} ({site.view})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {compoundChoices.length === 0 ? (
              <div className="mb-5 rounded-xl border border-border bg-muted/30 p-4 text-center">
                <p className="text-base text-muted-foreground">
                  Add a medication in Inventory before logging a dose.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-2">
                    Medication
                  </label>
                  <select
                    value={compound}
                    onChange={(e) => applyCompound(e.target.value)}
                    className="w-full bg-input/50 border-2 border-border rounded-xl p-4 text-lg font-medium text-foreground focus:ring-2 focus:ring-primary focus:outline-none appearance-none"
                  >
                    {compoundChoices.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-2">
                    Dose
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                      className="flex-1 bg-input/50 border-2 border-border rounded-xl p-4 text-2xl font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-none min-w-0"
                    />
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as DoseUnit)}
                      className="text-sm font-bold bg-secondary border-2 border-border rounded-xl p-4 shrink-0"
                    >
                      <option value="mg">mg</option>
                      <option value="mcg">mcg</option>
                      <option value="ml">ml</option>
                      <option value="IU">IU</option>
                      <option value="tablet">tab</option>
                      <option value="chew">chew</option>
                      <option value="drop">drop</option>
                      <option value="pump">pump</option>
                    </select>
                  </div>
                  {(selectedItem?.frequency || drawnVolume) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {selectedItem?.frequency ? (
                        <span className="text-xs text-muted-foreground bg-background/60 border border-border rounded-full px-3 py-1">
                          {selectedItem.frequency}
                        </span>
                      ) : null}
                      {drawnVolume ? (
                        <span className="text-xs text-muted-foreground bg-background/60 border border-border rounded-full px-3 py-1">
                          {drawnVolume.label}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-2">
                    When
                  </label>
                  <input
                    type="datetime-local"
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                    className="w-full bg-input/50 border-2 border-border rounded-xl p-4 text-lg text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-2">
                    Notes <span className="font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reaction, vet note, appetite…"
                    className="w-full bg-input/50 border-2 border-border rounded-xl p-4 text-lg text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-base text-destructive font-medium mb-4" role="alert">
                {error}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={!canSave}
              className="w-full bg-primary text-primary-foreground font-bold text-xl rounded-2xl py-5 flex items-center justify-center gap-3 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity active:scale-[0.98] mb-2"
            >
              <Check size={26} strokeWidth={3} />
              Save
            </button>

            {quickMode && selectedSite && (
              <p className="text-center text-xs text-muted-foreground pb-2">
                Logging to {siteLabel(selectedSite.id)}
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
