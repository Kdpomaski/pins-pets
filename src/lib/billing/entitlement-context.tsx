/**
 * React bridge for entitlement + soft paywall open state (Pins Pets).
 * Soft paywall is shown only when VITE_PAYWALL_ENABLED=true.
 * Never hard-blocks basic dose log / site rotation.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  getEntitlement,
  hasShownFirstDosePaywall,
  markFirstDosePaywallShown,
  refreshEntitlement,
  type EntitlementState,
} from '@/lib/billing/entitlements';
import { isPaywallEnabled } from '@/lib/billing/feature-flags';
import {
  canAccessFeature,
  countPets,
  countProtocols,
  type FeatureId,
  type AccessResult,
} from '@/lib/billing/products';
import type { PinsData } from '@/lib/store';

export type PaywallReason =
  | 'after_first_log'
  | 'second_pet'
  | 'export_locked'
  | 'generic_pro'
  | 'manual';

type EntitlementContextValue = {
  entitlement: EntitlementState;
  isPro: boolean;
  paywallEnabled: boolean;
  paywallOpen: boolean;
  paywallReason: PaywallReason;
  refresh: () => Promise<void>;
  openPaywall: (reason?: PaywallReason) => void;
  closePaywall: () => void;
  /** Soft gate helper using live entitlement. */
  checkFeature: (
    feature: FeatureId,
    opts?: { petCount?: number; protocolCount?: number },
  ) => AccessResult;
  /**
   * After a successful real dose log: optionally open soft paywall once
   * (never blocks logging). Transition into first real log only.
   */
  maybeShowSoftPaywallAfterFirstLog: (priorLogCount: number) => void;
  /**
   * Soft-gate a Pro action: opens paywall when blocked & flag on;
   * returns whether action may proceed.
   * When paywall flag is off (TestFlight free), Pro actions stay allowed.
   */
  requirePro: (
    feature: FeatureId,
    opts?: { petCount?: number; protocolCount?: number; reason?: PaywallReason },
  ) => boolean;
  petCountFromData: (data: PinsData) => number;
  protocolCountFromData: (data: PinsData) => number;
};

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entitlement, setEntitlement] = useState<EntitlementState>(() => getEntitlement());
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>('manual');
  const paywallEnabled = isPaywallEnabled();

  const refresh = useCallback(async () => {
    const next = await refreshEntitlement(user?.id ?? null);
    setEntitlement(next);
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openPaywall = useCallback(
    (reason: PaywallReason = 'manual') => {
      if (!paywallEnabled) return;
      if (entitlement.isPro) return;
      setPaywallReason(reason);
      setPaywallOpen(true);
    },
    [paywallEnabled, entitlement.isPro],
  );

  const closePaywall = useCallback(() => {
    setPaywallOpen(false);
  }, []);

  const checkFeature = useCallback(
    (
      feature: FeatureId,
      opts?: { petCount?: number; protocolCount?: number },
    ): AccessResult => {
      return canAccessFeature(feature, {
        isPro: entitlement.isPro,
        petCount: opts?.petCount,
        protocolCount: opts?.protocolCount,
      });
    },
    [entitlement.isPro],
  );

  const maybeShowSoftPaywallAfterFirstLog = useCallback(
    (priorLogCount: number) => {
      if (!paywallEnabled || entitlement.isPro) return;
      if (priorLogCount !== 0) return;
      if (hasShownFirstDosePaywall()) return;
      markFirstDosePaywallShown();
      setPaywallReason('after_first_log');
      setPaywallOpen(true);
    },
    [paywallEnabled, entitlement.isPro],
  );

  const requirePro = useCallback(
    (
      feature: FeatureId,
      opts?: { petCount?: number; protocolCount?: number; reason?: PaywallReason },
    ): boolean => {
      const access = checkFeature(feature, {
        petCount: opts?.petCount,
        protocolCount: opts?.protocolCount,
      });
      if (access.allowed) return true;
      if (!paywallEnabled) {
        // Flag off (TestFlight free): do not block Pro-only UI yet.
        return true;
      }
      openPaywall(
        opts?.reason ??
          (feature === 'export_pdf'
            ? 'export_locked'
            : feature === 'pets'
              ? 'second_pet'
              : 'generic_pro'),
      );
      return false;
    },
    [checkFeature, openPaywall, paywallEnabled],
  );

  const petCountFromData = useCallback((data: PinsData) => countPets(data.pets), []);
  const protocolCountFromData = useCallback(
    (data: PinsData) => countProtocols(data.schedule),
    [],
  );

  const value = useMemo<EntitlementContextValue>(
    () => ({
      entitlement,
      isPro: entitlement.isPro,
      paywallEnabled,
      paywallOpen,
      paywallReason,
      refresh,
      openPaywall,
      closePaywall,
      checkFeature,
      maybeShowSoftPaywallAfterFirstLog,
      requirePro,
      petCountFromData,
      protocolCountFromData,
    }),
    [
      entitlement,
      paywallEnabled,
      paywallOpen,
      paywallReason,
      refresh,
      openPaywall,
      closePaywall,
      checkFeature,
      maybeShowSoftPaywallAfterFirstLog,
      requirePro,
      petCountFromData,
      protocolCountFromData,
    ],
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlements(): EntitlementContextValue {
  const ctx = useContext(EntitlementContext);
  if (!ctx) throw new Error('useEntitlements must be used within EntitlementProvider');
  return ctx;
}

/** Optional hook when provider may be absent (e.g. early boot). */
export function useEntitlementsOptional(): EntitlementContextValue | null {
  return useContext(EntitlementContext);
}
