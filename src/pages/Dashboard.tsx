import { useState } from "react";
import { format, differenceInHours } from "date-fns";
import { Flame, Syringe, Droplets, Droplet, Calculator, Shield } from "lucide-react";
import { Link } from "wouter";
import { usePinsStore, inventoryForPet } from "@/lib/store";
import { SecurityBadge, SecuritySettings } from "@/components/SecuritySettings";
import { PinsPetsHeader, PetSwitcher } from "@/components/Brand";
import { siteLabel } from "@/lib/body-map-data";

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data, activePet } = usePinsStore();
  const [securityOpen, setSecurityOpen] = useState(false);
  const logs = data.logs.filter((l) => l.petId === activePet?.id);
  const schedule = data.schedule.filter((s) => s.petId === activePet?.id);
  const inventory = inventoryForPet(data.inventory, activePet?.id ?? null);

  const todayStr   = format(new Date(), "EEEE");
  const todayIndex = new Date().getDay();

  const calculateStreak = () => {
    const uniqueDays = new Set(logs.map((l) => format(new Date(l.timestamp), "yyyy-MM-dd")));
    let streak = 0;
    let d = new Date();
    while (uniqueDays.has(format(d, "yyyy-MM-dd"))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    if (streak === 0) {
      d = new Date();
      d.setDate(d.getDate() - 1);
      while (uniqueDays.has(format(d, "yyyy-MM-dd"))) {
        streak++;
        d.setDate(d.getDate() - 1);
      }
    }
    return streak;
  };

  const streak      = calculateStreak();
  const todaysDoses = schedule.filter((s) => s.active && s.days.includes(todayIndex));
  const todaysLogs  = logs.filter(
    (l) => format(new Date(l.timestamp), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  );
  const recentLogs   = logs.slice(0, 5);
  const lowInventory = inventory.filter((i) => i.remainingVolume / i.totalVolume < 0.2);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-8">

        {/* Header — Pins brand logo */}
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <PinsPetsHeader />
            <div className="flex items-center gap-2">
              <PetSwitcher />
              <SecurityBadge />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSecurityOpen(true)}
              className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              aria-label="Security settings"
            >
              <Shield size={18} />
            </button>
            <Link
              href="/calculator"
              className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              aria-label="Dose calculator"
            >
              <Calculator size={18} />
            </Link>
          </div>
        </header>

        <SecuritySettings open={securityOpen} onClose={() => setSecurityOpen(false)} />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border p-4 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Flame size={16} className="text-orange-500" />
              <span className="text-sm font-medium uppercase tracking-wider">Streak</span>
            </div>
            <div className="text-4xl font-bold font-mono">
              {streak} <span className="text-sm font-sans text-muted-foreground font-normal">days</span>
            </div>
          </div>

          <div className="bg-card border border-border p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Syringe size={16} className="text-primary" />
              <span className="text-sm font-medium uppercase tracking-wider">Today</span>
            </div>
            <div className="text-4xl font-bold font-mono">
              {todaysLogs.length} <span className="text-sm font-sans text-muted-foreground font-normal">doses</span>
            </div>
          </div>
        </div>

        {/* Today's Protocol */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-semibold">Today's Protocol</h2>
            <span className="text-sm text-muted-foreground">{todayStr}</span>
          </div>

          {todaysDoses.length === 0 ? (
            <div className="bg-card/50 border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
              No doses scheduled for today.
            </div>
          ) : (
            <div className="space-y-3">
              {todaysDoses.map((dose) => {
                const isLogged    = todaysLogs.some((l) => l.compound === dose.compound);
                const compoundData = inventory.find((i) => i.name === dose.compound);
                return (
                  <div key={dose.id} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-border relative">
                        <div className="absolute inset-0 rounded-full opacity-20 blur-md"
                          style={{ backgroundColor: compoundData?.color ?? "var(--color-primary)" }} />
                        <Droplet size={20} style={{ color: compoundData?.color ?? "var(--color-primary)" }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          {dose.compound}
                          {isLogged && (
                            <span className="text-[10px] bg-green-100 text-green-700 border border-border px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                              Done
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {dose.dose} {dose.unit} at {dose.time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Low Inventory Warning */}
        {lowInventory.length > 0 && (
          <section>
            <div className="bg-red-50 border border-border rounded-xl p-4 flex gap-3 items-start">
              <Droplets className="text-red-600 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-red-700">Low Inventory</h3>
                <p className="text-sm text-red-600/80 mt-1">
                  {lowInventory.map((i) => i.name).join(", ")} running low.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Recent Injections */}
        <section className="bg-card border border-border rounded-2xl p-4">
          <h2 className="text-lg font-semibold mb-4">Recent doses</h2>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No doses logged yet.</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const compoundData = inventory.find((i) => i.name === log.compound);
                const hoursAgo = differenceInHours(new Date(), new Date(log.timestamp));
                const timeStr  = hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;
                const place = log.siteId ? siteLabel(log.siteId) : log.medType;

                return (
                  <div key={log.id} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: compoundData?.color ?? "var(--color-primary)",
                        boxShadow: `0 0 8px ${(compoundData?.color ?? "#fff")}80`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium text-foreground">{log.compound}</span>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{timeStr}</span>
                      </div>
                      <div className="flex justify-between items-baseline text-sm text-muted-foreground">
                        <span className="capitalize truncate">{place}</span>
                        <span className="ml-2 flex-shrink-0">{log.dose} {log.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
