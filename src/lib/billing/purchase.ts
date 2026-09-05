/**
 * Capacitor-friendly StoreKit 2 / Play Billing stubs (Pins Pets).
 *
 * Native plugins are NOT wired yet. Web / mock path can set local Pro when
 * VITE_BILLING_MOCK=true. Live IAP products must NOT be created in ASC/Play
 * until Kevin's money gate.
 */

import {
  BUNDLE_PRODUCT_IDS,
  PETS_PRODUCT_IDS,
  PETS_PRODUCTS,
  PRIMARY_PRODUCT_ID,
  getProductById,
  type ProductStub,
} from '@/lib/billing/products';
import { isBillingMockEnabled } from '@/lib/billing/feature-flags';
import {
  KNOWN_PRO_PRODUCT_IDS,
  getEntitlement,
  planFromProductId,
  setLocalEntitlement,
  upsertSupabaseEntitlement,
  type EntitlementState,
} from '@/lib/billing/entitlements';

export type PurchaseResult =
  | { ok: true; entitlement: EntitlementState; mocked?: boolean; productId: string }
  | { ok: false; error: string; cancelled?: boolean; code?: 'cancelled' | 'unavailable' | 'failed' | 'not_configured' };

export type RestoreResult =
  | {
      ok: true;
      entitlement: EntitlementState;
      restored: boolean;
      mocked?: boolean;
      restoredProductIds: string[];
    }
  | { ok: false; error: string; code?: 'none_found' | 'unavailable' | 'failed' | 'not_configured' };

export type BillingPlatform = 'ios' | 'android' | 'web' | 'unknown';

/** StoreKit 2–shaped purchase request (stub). */
export type StoreKit2PurchaseRequest = {
  productId: string;
  appAccountToken?: string;
};

/** Play Billing–shaped purchase request (stub). */
export type PlayBillingPurchaseRequest = {
  productId: string;
  obfuscatedAccountId?: string;
};

/** Detect rough platform for future native plugin routing. */
export function detectBillingPlatform(): BillingPlatform {
  if (typeof window === 'undefined') return 'unknown';
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const platform = cap?.getPlatform?.();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
}

export type PurchaseOptions = {
  productId: string;
  /** Signed-in Supabase user id — when present, stub-upsert shared entitlement. */
  userId?: string | null;
};

/**
 * Purchase stub (StoreKit 2 / Play Billing).
 * - Mock mode: grants local Pro immediately.
 * - Otherwise: returns a clear "not configured" error (no live IAP).
 */
export async function purchaseProduct(opts: PurchaseOptions): Promise<PurchaseResult> {
  const product = getProductById(opts.productId);
  if (!product) {
    return { ok: false, error: `Unknown product id: ${opts.productId}`, code: 'failed' };
  }

  if (isBillingMockEnabled()) {
    const entitlement = setLocalEntitlement({
      isPro: true,
      source: 'mock',
      plan: planFromProductId(opts.productId),
      productId: opts.productId,
      isBundle: product.scope === 'bundle',
    });
    if (opts.userId) {
      await upsertSupabaseEntitlement({
        userId: opts.userId,
        entitlement,
        sourceApp: product.scope === 'bundle' ? 'bundle' : 'pinspets',
      });
    }
    return { ok: true, entitlement, mocked: true, productId: opts.productId };
  }

  const platform = detectBillingPlatform();
  if (platform === 'ios') {
    return {
      ok: false,
      code: 'not_configured',
      error:
        'StoreKit 2 bridge not configured (stub). Product IDs are stubs only — live IAP awaits Kevin money gate. Enable VITE_BILLING_MOCK for local testing.',
    };
  }
  if (platform === 'android') {
    return {
      ok: false,
      code: 'not_configured',
      error:
        'Play Billing bridge not configured (stub). Product IDs are stubs only — live IAP awaits Kevin money gate. Enable VITE_BILLING_MOCK for local testing.',
    };
  }
  return {
    ok: false,
    code: 'unavailable',
    error:
      'In-app purchases are not available on web. Use the native app, or set VITE_BILLING_MOCK=true for local Pro testing.',
  };
}

export async function purchasePrimaryAnnual(userId?: string | null): Promise<PurchaseResult> {
  return purchaseProduct({ productId: PRIMARY_PRODUCT_ID, userId });
}

export async function purchaseFoundingBundle(userId?: string | null): Promise<PurchaseResult> {
  return purchaseProduct({ productId: BUNDLE_PRODUCT_IDS.lifetime, userId });
}

/**
 * Restore purchases stub.
 * - Mock mode: re-affirm local Pro if present; else restored=false.
 * - Native: placeholder until StoreKit 2 / Play Billing plugins land.
 */
export async function restorePurchases(opts?: {
  userId?: string | null;
}): Promise<RestoreResult> {
  if (isBillingMockEnabled()) {
    const existing = getEntitlement();
    if (existing.isPro) {
      if (opts?.userId) {
        await upsertSupabaseEntitlement({ userId: opts.userId, entitlement: existing });
      }
      return {
        ok: true,
        entitlement: existing,
        restored: true,
        mocked: true,
        restoredProductIds: existing.productId ? [existing.productId] : [PETS_PRODUCT_IDS.yearly],
      };
    }
    return {
      ok: true,
      entitlement: existing,
      restored: false,
      mocked: true,
      restoredProductIds: [],
    };
  }

  const platform = detectBillingPlatform();
  if (platform === 'ios' || platform === 'android') {
    return {
      ok: false,
      code: 'not_configured',
      error: 'Restore Purchases stub — native StoreKit 2 / Play Billing restore not wired yet.',
    };
  }
  return {
    ok: false,
    code: 'unavailable',
    error: 'Restore is not available on web without VITE_BILLING_MOCK=true.',
  };
}

/** List catalog stubs for UI (Pets single-app offers; lifetime hidden until locked). */
export function listPetsOfferProducts(): ProductStub[] {
  return PETS_PRODUCTS.filter((p) => !p.hidden);
}

export function getFoundingBundleProduct(): ProductStub | undefined {
  return getProductById(BUNDLE_PRODUCT_IDS.lifetime);
}

/** Interface sketch for a future native plugin. */
export interface NativeBillingBridge {
  getProducts(ids: string[]): Promise<ProductStub[]>;
  purchase(req: StoreKit2PurchaseRequest | PlayBillingPurchaseRequest): Promise<PurchaseResult>;
  restore(): Promise<RestoreResult>;
}

export function listStubProductIds(): string[] {
  return [...KNOWN_PRO_PRODUCT_IDS];
}
