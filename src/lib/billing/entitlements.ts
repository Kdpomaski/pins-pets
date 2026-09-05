/**
 * Local entitlement state + stub Supabase upsert/fetch for Pins Pets.
 *
 * Bundle entitlement model (locked decision):
 * - Purchase or restore in either Pins or Pins Pets → validate with StoreKit 2 /
 *   Play Billing → set local Pro + upsert shared Supabase entitlement when signed in.
 * - Other app reads the same Supabase entitlement (or restore) so Bundle unlocks
 *   Pro in both apps after restore / sign-in.
 * - Offline / no account: keep local entitlement flag; on next sign-in, merge.
 * - v1 does NOT invent full server-side receipt verification — stub hooks only.
 *
 * Source: /workspace/bus/decisions/2026-09-03-app-monetization.md
 */

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { BUNDLE_PRODUCT_IDS, PETS_PRODUCT_IDS } from '@/lib/billing/products';

const ENTITLEMENT_KEY = 'pinspets.entitlement.v1';
const FIRST_DOSE_PAYWALL_KEY = 'pinspets.paywall.firstDoseShown';

export type EntitlementSource = 'none' | 'local' | 'mock' | 'store' | 'supabase' | 'bundle';

export type EntitlementPlan =
  | 'none'
  | 'pinspets_monthly'
  | 'pinspets_yearly'
  | 'pinspets_lifetime'
  | 'bundle_monthly'
  | 'bundle_yearly'
  | 'bundle_lifetime';

export type EntitlementState = {
  isPro: boolean;
  source: EntitlementSource;
  plan: EntitlementPlan;
  productId: string | null;
  /** Bundle unlocks both Pins and Pins Pets on the same account. */
  isBundle: boolean;
  /** ISO timestamp when local entitlement was last updated. */
  updatedAt: string | null;
};

/** Shape mirrored to Supabase `user_entitlements` (stub table). Shared with Pins. */
export type SupabaseEntitlementRow = {
  user_id: string;
  is_pro: boolean;
  plan: EntitlementPlan;
  product_id: string | null;
  is_bundle: boolean;
  source_app: 'pins' | 'pinspets' | 'bundle';
  updated_at: string;
};

const DEFAULT_STATE: EntitlementState = {
  isPro: false,
  source: 'none',
  plan: 'none',
  productId: null,
  isBundle: false,
  updatedAt: null,
};

function isBundleProduct(productId: string | null): boolean {
  if (!productId) return false;
  return (Object.values(BUNDLE_PRODUCT_IDS) as string[]).includes(productId);
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** In-memory fallback when localStorage is unavailable. */
let memory: EntitlementState | null = null;
let memoryFirstDoseShown = false;

function persist(state: EntitlementState): void {
  memory = state;
  writeStorage(ENTITLEMENT_KEY, JSON.stringify(state));
}

export function getEntitlement(): EntitlementState {
  const raw = readStorage(ENTITLEMENT_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<EntitlementState>;
      return {
        isPro: Boolean(parsed.isPro),
        source: parsed.source ?? 'local',
        plan: parsed.plan ?? 'none',
        productId: parsed.productId ?? null,
        isBundle: Boolean(parsed.isBundle) || isBundleProduct(parsed.productId ?? null),
        updatedAt: parsed.updatedAt ?? null,
      };
    } catch {
      // fall through
    }
  }
  if (memory) return { ...memory };
  return { ...DEFAULT_STATE };
}

export function isProUser(): boolean {
  return getEntitlement().isPro;
}

export type SetEntitlementInput = {
  isPro: boolean;
  source?: EntitlementSource;
  plan?: EntitlementPlan;
  productId?: string | null;
  isBundle?: boolean;
};

/**
 * Persist Pro unlock locally (stub). Real billing calls this after a verified
 * purchase / restore. Bundle plans also set isPro for this app.
 */
export function setLocalEntitlement(input: SetEntitlementInput): EntitlementState {
  if (!input.isPro) {
    memory = null;
    removeStorage(ENTITLEMENT_KEY);
    return { ...DEFAULT_STATE };
  }

  const productId = input.productId ?? null;
  const next: EntitlementState = {
    isPro: true,
    source: input.source ?? 'local',
    plan: input.plan ?? 'none',
    productId,
    isBundle: input.isBundle ?? isBundleProduct(productId),
    updatedAt: new Date().toISOString(),
  };
  persist(next);
  return { ...next };
}

/** Clear local entitlement (logout / debug). Does not delete Supabase row. */
export function clearLocalEntitlement(): void {
  memory = null;
  removeStorage(ENTITLEMENT_KEY);
}

export function planFromProductId(productId: string): EntitlementPlan {
  switch (productId) {
    case PETS_PRODUCT_IDS.monthly:
      return 'pinspets_monthly';
    case PETS_PRODUCT_IDS.yearly:
      return 'pinspets_yearly';
    case PETS_PRODUCT_IDS.lifetime:
      return 'pinspets_lifetime';
    case BUNDLE_PRODUCT_IDS.monthly:
      return 'bundle_monthly';
    case BUNDLE_PRODUCT_IDS.yearly:
      return 'bundle_yearly';
    case BUNDLE_PRODUCT_IDS.lifetime:
      return 'bundle_lifetime';
    default:
      return 'none';
  }
}

/**
 * Stub upsert into Supabase `user_entitlements`.
 * Shared with Pins so a Bundle purchase unlocks Pro in both apps via the
 * signed-in account. Also mirrors a compact payload into user_metadata.
 *
 * No-op when Supabase is not configured or user is signed out.
 * Table may not exist yet — errors are swallowed and logged.
 */
export async function upsertSupabaseEntitlement(opts: {
  userId: string;
  entitlement: EntitlementState;
  sourceApp?: 'pins' | 'pinspets' | 'bundle';
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase not configured' };
  }
  if (!opts.userId) {
    return { ok: false, error: 'Missing user id' };
  }
  if (!opts.entitlement.isPro) {
    return { ok: true };
  }

  const sourceApp =
    opts.sourceApp ??
    (opts.entitlement.isBundle || opts.entitlement.plan.startsWith('bundle')
      ? 'bundle'
      : 'pinspets');

  const row: SupabaseEntitlementRow = {
    user_id: opts.userId,
    is_pro: true,
    plan: opts.entitlement.plan,
    product_id: opts.entitlement.productId,
    is_bundle: opts.entitlement.isBundle,
    source_app: sourceApp,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from('user_entitlements').upsert(row, {
      onConflict: 'user_id',
    });
    if (error) {
      console.warn('[billing] entitlements upsert stub failed (table may be absent)', error.message);
      // Fallback stub: user_metadata so the other app can still read a shared flag.
      const meta = await supabase.auth.updateUser({
        data: {
          entitlements: {
            pins_pro: true,
            pinspets_pro: true,
            product_id: row.product_id,
            is_bundle: row.is_bundle,
            plan: row.plan,
            updated_at: row.updated_at,
            source: opts.entitlement.source,
            source_app: sourceApp,
          },
        },
      });
      if (meta.error) return { ok: false, error: error.message };
      return { ok: true };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown upsert error';
    console.warn('[billing] entitlements upsert stub threw', message);
    return { ok: false, error: message };
  }
}

/**
 * Stub fetch of shared entitlement for the signed-in user.
 * Prefer remote Pro if present so Bundle purchased in Pins unlocks Pets (and vice versa).
 */
export async function fetchSupabaseEntitlement(
  userId: string,
): Promise<{ ok: boolean; entitlement?: EntitlementState; error?: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase not configured' };
  }
  if (!userId) {
    return { ok: false, error: 'Missing user id' };
  }

  try {
    const { data, error } = await supabase
      .from('user_entitlements')
      .select('is_pro, plan, product_id, is_bundle, updated_at, source_app')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data?.is_pro) {
      const entitlement: EntitlementState = {
        isPro: true,
        source: data.source_app === 'bundle' ? 'bundle' : 'supabase',
        plan: (data.plan as EntitlementPlan) || 'none',
        productId: data.product_id ?? null,
        isBundle: Boolean(data.is_bundle) || isBundleProduct(data.product_id ?? null),
        updatedAt: data.updated_at ?? null,
      };
      setLocalEntitlement({
        isPro: true,
        source: entitlement.source,
        plan: entitlement.plan,
        productId: entitlement.productId,
        isBundle: entitlement.isBundle,
      });
      return { ok: true, entitlement };
    }

    if (error) {
      console.warn('[billing] entitlements fetch stub failed (table may be absent)', error.message);
    }

    // Fallback: user_metadata.entitlements written by either app.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const meta = (session?.user?.user_metadata?.entitlements ?? null) as
      | {
          pins_pro?: boolean;
          pinspets_pro?: boolean;
          product_id?: string | null;
          is_bundle?: boolean;
          plan?: EntitlementPlan;
          updated_at?: string | null;
          source?: EntitlementSource;
          source_app?: string;
        }
      | null;

    if (meta && (meta.pins_pro || meta.pinspets_pro || meta.is_bundle)) {
      const entitlement: EntitlementState = {
        isPro: true,
        source: meta.is_bundle || meta.source_app === 'bundle' ? 'bundle' : 'supabase',
        plan: meta.plan ?? 'none',
        productId: meta.product_id ?? null,
        isBundle: Boolean(meta.is_bundle) || isBundleProduct(meta.product_id ?? null),
        updatedAt: meta.updated_at ?? null,
      };
      setLocalEntitlement({
        isPro: true,
        source: entitlement.source,
        plan: entitlement.plan,
        productId: entitlement.productId,
        isBundle: entitlement.isBundle,
      });
      return { ok: true, entitlement };
    }

    return { ok: true, entitlement: { ...DEFAULT_STATE } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown fetch error';
    console.warn('[billing] entitlements fetch stub threw', message);
    return { ok: false, error: message };
  }
}

/**
 * Refresh entitlement: local first, then optional Supabase merge when signed in.
 * Call on app launch / after Restore.
 */
export async function refreshEntitlement(userId?: string | null): Promise<EntitlementState> {
  const local = getEntitlement();
  if (!userId) return local;

  const remote = await fetchSupabaseEntitlement(userId);
  if (remote.ok && remote.entitlement?.isPro) {
    return remote.entitlement;
  }
  // If local Pro and signed in, push stub upsert so Pins can see Bundle later.
  if (local.isPro) {
    await upsertSupabaseEntitlement({ userId, entitlement: local });
  }
  return getEntitlement();
}

export function hasShownFirstDosePaywall(): boolean {
  if (readStorage(FIRST_DOSE_PAYWALL_KEY) === '1') return true;
  return memoryFirstDoseShown;
}

export function markFirstDosePaywallShown(): void {
  memoryFirstDoseShown = true;
  writeStorage(FIRST_DOSE_PAYWALL_KEY, '1');
}

export function resetFirstDosePaywallFlag(): void {
  memoryFirstDoseShown = false;
  removeStorage(FIRST_DOSE_PAYWALL_KEY);
}

export const KNOWN_PRO_PRODUCT_IDS = [
  ...Object.values(PETS_PRODUCT_IDS),
  ...Object.values(BUNDLE_PRODUCT_IDS),
] as const;
