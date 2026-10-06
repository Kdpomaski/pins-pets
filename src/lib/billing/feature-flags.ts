/**
 * Freemium / soft-paywall feature flags.
 *
 * Defaults keep the store build free:
 * - PAYWALL_ENABLED is hard-coded false (VITE_PAYWALL_ENABLED is not read)
 * - VITE_FOUNDING_LIFETIME = false
 * - VITE_BILLING_MOCK = false
 */

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw == null || raw === '') return fallback;
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return fallback;
}

/**
 * Soft paywall + Pro gating UI. Kevin standing GO: OFF always.
 * Compile-time constant so production builds can drop paywall UI modules.
 * Do not flip this for an App Store build that has no in-app purchase.
 */
export const PAYWALL_ENABLED = false;

/** Soft paywall + Pro gating UI. Kevin standing GO: OFF always. */
export function isPaywallEnabled(): boolean {
  return PAYWALL_ENABLED;
}

/**
 * Show founding lifetime ($39.99 bundle) offer in paywall UI.
 * Default false until TF founding window is intentionally enabled.
 */
export function isFoundingLifetimeEnabled(): boolean {
  return parseBool(import.meta.env.VITE_FOUNDING_LIFETIME, false);
}

/**
 * When true, purchase/restore stubs set local Pro without StoreKit / Play.
 * For web/dev only — never enable for production store builds.
 */
export function isBillingMockEnabled(): boolean {
  return parseBool(import.meta.env.VITE_BILLING_MOCK, false);
}

export const BILLING_FLAGS = {
  paywallEnabled: isPaywallEnabled,
  foundingLifetime: isFoundingLifetimeEnabled,
  billingMock: isBillingMockEnabled,
} as const;
