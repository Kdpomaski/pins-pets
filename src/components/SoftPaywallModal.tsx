/**
 * Soft Pro paywall UI (Pins Pets). Never hard-blocks basic logging.
 * Behind VITE_PAYWALL_ENABLED. Purchase/restore use billing stubs only.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  BUNDLE_COPY,
  CONTEXT_COPY,
  PAYWALL_COPY,
  PRO_BULLETS,
  purchaseFoundingBundle,
  purchasePrimaryAnnual,
  purchaseProduct,
  restorePurchases,
  PETS_PRODUCT_IDS,
  isFoundingLifetimeEnabled,
} from '@/lib/billing';
import { useEntitlements, type PaywallReason } from '@/lib/billing/entitlement-context';
import { Button } from '@/components/ui/button';

function reasonCopy(reason: PaywallReason) {
  switch (reason) {
    case 'after_first_log':
      return CONTEXT_COPY.afterFirstLog;
    case 'second_pet':
      return CONTEXT_COPY.secondPet;
    case 'export_locked':
      return CONTEXT_COPY.exportLocked;
    case 'generic_pro':
      return CONTEXT_COPY.genericPro;
    default:
      return null;
  }
}

export function SoftPaywallModal() {
  const { user } = useAuth();
  const { paywallOpen, paywallReason, closePaywall, refresh, isPro } = useEntitlements();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const showFounding = isFoundingLifetimeEnabled();
  const contextual = reasonCopy(paywallReason);

  if (isPro) return null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleAnnual = () =>
    void run(async () => {
      const result = await purchasePrimaryAnnual(user?.id);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(result.mocked ? 'Mock Pro unlocked (billing mock).' : 'Purchase complete.');
      closePaywall();
    });

  const handleMonthly = () =>
    void run(async () => {
      const result = await purchaseProduct({
        productId: PETS_PRODUCT_IDS.monthly,
        userId: user?.id,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(result.mocked ? 'Mock Pro unlocked (billing mock).' : 'Purchase complete.');
      closePaywall();
    });

  const handleFounding = () =>
    void run(async () => {
      const result = await purchaseFoundingBundle(user?.id);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(
        result.mocked
          ? 'Mock Bundle Pro unlocked for both apps (billing mock).'
          : 'Founding bundle unlocked.',
      );
      closePaywall();
    });

  const handleRestore = () =>
    void run(async () => {
      const result = await restorePurchases({ userId: user?.id });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (result.restored) {
        setMessage('Purchases restored.');
        closePaywall();
      } else {
        setMessage('No purchases to restore.');
      }
    });

  return (
    <AnimatePresence>
      {paywallOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePaywall}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t-2 border-border rounded-t-3xl max-w-md mx-auto shadow-2xl px-5 pt-5 pb-safe max-h-[92vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="soft-paywall-title"
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <div className="min-w-0">
                <h2 id="soft-paywall-title" className="text-xl font-bold text-foreground">
                  {contextual?.title ?? PAYWALL_COPY.headline}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {contextual?.body ?? PAYWALL_COPY.subhead}
                </p>
              </div>
              <button
                type="button"
                onClick={closePaywall}
                className="p-2 text-muted-foreground bg-secondary/60 rounded-full shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <ul className="space-y-2 mb-4">
              {PRO_BULLETS.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="text-primary mt-0.5 shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground mb-4">{PAYWALL_COPY.reassure}</p>

            <div className="space-y-2 mb-3">
              <Button className="w-full h-12 text-base" disabled={busy} onClick={handleAnnual}>
                {PAYWALL_COPY.ctaPrimary}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                {PAYWALL_COPY.ctaPrimarySub}
              </p>
              <Button
                variant="outline"
                className="w-full"
                disabled={busy}
                onClick={handleMonthly}
              >
                {PAYWALL_COPY.ctaMonthly}
              </Button>
              {showFounding && (
                <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {BUNDLE_COPY.badge}
                  </p>
                  <p className="text-sm font-medium">{BUNDLE_COPY.headline}</p>
                  <p className="text-xs text-muted-foreground">{BUNDLE_COPY.subhead}</p>
                  <Button className="w-full" disabled={busy} onClick={handleFounding}>
                    {BUNDLE_COPY.cta}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">{BUNDLE_COPY.entitlement}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mb-4">
              <button
                type="button"
                className="text-sm text-primary font-medium underline-offset-2 hover:underline disabled:opacity-50"
                disabled={busy}
                onClick={handleRestore}
              >
                {PAYWALL_COPY.restore}
              </button>
              <button
                type="button"
                className="text-sm text-muted-foreground"
                disabled={busy}
                onClick={closePaywall}
              >
                {contextual?.dismiss ?? PAYWALL_COPY.continueFree}
              </button>
            </div>

            {message && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-3" role="status">
                {message}
              </p>
            )}

            <p className="text-[10px] leading-relaxed text-muted-foreground pb-2">
              {PAYWALL_COPY.legalRow}
            </p>
            <p className="text-[10px] leading-relaxed text-muted-foreground pb-4">
              {PAYWALL_COPY.disclaimer}
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
