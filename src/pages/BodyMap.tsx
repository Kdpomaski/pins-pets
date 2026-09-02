import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePinsStore, inventoryForPet, type InventoryItem } from "@/lib/store";
import { MAP_IMAGES, sitesFor, type MapView } from "@/lib/body-map-data";
import { PetSwitcher, PinsPetsHeader } from "@/components/Brand";

interface InjectionLog {
  id: string;
  siteId: string;
  region: string;
  compound: string;
  dose: number;
  time: string;
}

const NEUTRAL_PIN = "rgba(255, 255, 255, 0.12)";

const BodyMap: React.FC<{
  onLogInjection?: (siteId: string, compoundName?: string) => void;
  logs?: InjectionLog[];
}> = ({ onLogInjection, logs = [] }) => {
  const { data, activePet } = usePinsStore();
  const [view, setView] = useState<MapView>("side");
  const [selectedCompound, setSelectedCompound] = useState<InventoryItem | null>(null);

  const species = activePet?.species ?? "dog";
  const petInventory = useMemo(
    () => inventoryForPet(data.inventory, activePet?.id ?? null),
    [data.inventory, activePet?.id],
  );

  const compoundTabs = useMemo(() => {
    const seen = new Map<string, InventoryItem>();
    for (const item of petInventory) {
      if (!seen.has(item.name)) seen.set(item.name, item);
    }
    return Array.from(seen.values());
  }, [petInventory]);

  const filteredLogs = useMemo(
    () =>
      selectedCompound
        ? logs.filter((l) => l.compound === selectedCompound.name)
        : logs,
    [logs, selectedCompound],
  );

  const getSiteLogs = (siteId: string) =>
    filteredLogs
      .filter((l) => l.siteId === siteId)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const getLastDate = (siteId: string) => {
    const siteLogs = getSiteLogs(siteId);
    return siteLogs.length ? format(new Date(siteLogs[0].time), "MMM d, yyyy") : null;
  };

  const getStatusColor = (siteLogs: InjectionLog[]) => {
    if (selectedCompound && siteLogs.length === 0) return NEUTRAL_PIN;
    if (siteLogs.length === 0) return "rgba(74, 222, 128, 0.5)";
    const hoursAgo = (Date.now() - new Date(siteLogs[0].time).getTime()) / (1000 * 60 * 60);
    if (hoursAgo <= 24) return "#ef4444";
    if (hoursAgo <= 72) return "#eab308";
    return "rgba(74, 222, 128, 0.5)";
  };

  const regions = sitesFor(species, view);
  const mapSrc = MAP_IMAGES[species][view];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 pt-6 px-4">
      <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center gap-3">
        <PinsPetsHeader />
        <PetSwitcher />
      </div>
      <Card className="p-4 sm:p-6 bg-card border border-border max-w-4xl mx-auto shadow-sm">
        <div className="flex justify-between items-center mb-4 sm:mb-6 gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Body Map</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tap a spot to log {activePet ? `for ${activePet.name}` : ""}
            </p>
          </div>
          <Button
            variant="outline"
            className="border-border text-base px-5 py-5 h-auto min-h-[48px]"
            onClick={() => setView(view === "side" ? "top" : "side")}
          >
            {view === "side" ? "Top" : "Side"}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <aside className="md:w-44 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Medications
            </p>
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCompound(null)}
                className={`shrink-0 md:w-full text-left px-4 py-3 rounded-xl border text-base font-medium transition-colors min-h-[48px] ${
                  selectedCompound === null
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
              >
                All meds
              </button>
              {compoundTabs.map((item) => {
                const vialCount = petInventory.filter((v) => v.name === item.name).length;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() =>
                      setSelectedCompound((prev) => (prev?.name === item.name ? null : item))
                    }
                    className={`shrink-0 md:w-full text-left px-4 py-3 rounded-xl border text-base font-medium transition-colors flex items-center gap-2 min-h-[48px] ${
                      selectedCompound?.name === item.name
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate flex-1">{item.name}</span>
                    {vialCount > 1 && (
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        {vialCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="relative rounded-2xl overflow-hidden border border-border aspect-[3/2] bg-black">
              <img
                src={mapSrc}
                alt={`${species} ${view} body map`}
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />

              {regions.map((r) => {
                const siteLogs = getSiteLogs(r.id);
                const color = getStatusColor(siteLogs);
                const lastDate = getLastDate(r.id);
                const hasFilteredPin = siteLogs.length > 0;
                const title = lastDate ? `${r.label} — Last: ${lastDate}` : r.label;

                return (
                  <button
                    key={`${r.view}-${r.id}`}
                    type="button"
                    onClick={() => onLogInjection?.(r.id, selectedCompound?.name)}
                    aria-label={title}
                    title={title}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 focus:outline-none focus:ring-4 focus:ring-primary/50 group touch-manipulation"
                    style={{
                      left: `${r.cx}%`,
                      top: `${r.cy}%`,
                      width: "5.5%",
                      height: "8%",
                      minWidth: "28px",
                      minHeight: "28px",
                      backgroundColor: color,
                      borderColor:
                        hasFilteredPin || !selectedCompound
                          ? "rgba(255,255,255,0.8)"
                          : "rgba(255,255,255,0.25)",
                      boxShadow: hasFilteredPin ? "0 0 6px rgba(0,0,0,0.4)" : "none",
                      cursor: "pointer",
                      opacity: selectedCompound && !hasFilteredPin ? 0.7 : 1,
                    }}
                  />
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-semibold uppercase tracking-wider border border-border rounded-xl p-3 bg-muted/30">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: "rgba(74,222,128,0.5)" }} />
                7+ days
              </span>
              <span className="flex items-center gap-1.5 text-yellow-600">
                <span className="w-3 h-3 rounded-full bg-yellow-500" /> ≤ 3 days
              </span>
              <span className="flex items-center gap-1.5 text-red-600">
                <span className="w-3 h-3 rounded-full bg-red-500" /> ≤ 24h
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BodyMap;
