/**
 * Pins Pets Pro product catalog stubs + Free vs Pro matrix helpers.
 *
 * Source of truth: /workspace/bus/decisions/2026-09-03-app-monetization.md
 *
 * DO NOT create these SKUs in App Store Connect or Google Play Console
 * until Kevin approves the money gate. Display prices are UI stubs only.
 */

export type ProductPeriod = 'monthly' | 'yearly' | 'lifetime';

export type ProductStub = {
  id: string;
  period: ProductPeriod;
  /** Display price string for UI stubs (not live store pricing). */
  displayPrice: string;
  /** USD numeric hint for docs / UI only. Null when TBD. */
  priceUsd: number | null;
  /** Highlight as the primary offer. */
  primary?: boolean;
  /** TestFlight founding / early-supporter offer. */
  founding?: boolean;
  /** Hide from plan picker until Kevin locks display price. */
  hidden?: boolean;
  label: string;
  /** pinspets = single-app; bundle = Pins + Pets shared entitlement. */
  scope: 'pinspets' | 'bundle';
};

/** Locked Pins Pets single-app product IDs. */
export const PETS_PRODUCT_IDS = {
  monthly: 'com.two20tech.pinspets.pro.monthly',
  yearly: 'com.two20tech.pinspets.pro.yearly',
  lifetime: 'com.two20tech.pinspets.pro.lifetime',
} as const;

/** Locked cross-app bundle product IDs (shared Pins + Pets Pro). */
export const BUNDLE_PRODUCT_IDS = {
  monthly: 'com.two20tech.bundle.pro.monthly',
  yearly: 'com.two20tech.bundle.pro.yearly',
  lifetime: 'com.two20tech.bundle.pro.lifetime',
} as const;

export const PETS_PRODUCTS: ProductStub[] = [
  {
    id: PETS_PRODUCT_IDS.monthly,
    period: 'monthly',
    displayPrice: '$5.99/mo',
    priceUsd: 5.99,
    label: 'Monthly',
    scope: 'pinspets',
  },
  {
    id: PETS_PRODUCT_IDS.yearly,
    period: 'yearly',
    displayPrice: '$49.99/yr',
    priceUsd: 49.99,
    primary: true,
    label: 'Annual',
    scope: 'pinspets',
  },
  {
    id: PETS_PRODUCT_IDS.lifetime,
    period: 'lifetime',
    displayPrice: 'TBD',
    priceUsd: null,
    label: 'Lifetime',
    scope: 'pinspets',
    hidden: true,
  },
];

/** Bundle stubs — founding lifetime display $39.99 (TestFlight). Monthly/yearly TBD. */
export const BUNDLE_PRODUCTS: ProductStub[] = [
  {
    id: BUNDLE_PRODUCT_IDS.monthly,
    period: 'monthly',
    displayPrice: 'TBD',
    priceUsd: null,
    label: 'Bundle Monthly',
    scope: 'bundle',
    hidden: true,
  },
  {
    id: BUNDLE_PRODUCT_IDS.yearly,
    period: 'yearly',
    displayPrice: 'TBD',
    priceUsd: null,
    label: 'Bundle Annual',
    scope: 'bundle',
    hidden: true,
  },
  {
    id: BUNDLE_PRODUCT_IDS.lifetime,
    period: 'lifetime',
    displayPrice: '$39.99',
    priceUsd: 39.99,
    founding: true,
    label: 'Founding Lifetime (Pins + Pets)',
    scope: 'bundle',
  },
];

export const ALL_PRODUCTS: ProductStub[] = [...PETS_PRODUCTS, ...BUNDLE_PRODUCTS];

export const PRIMARY_PRODUCT_ID = PETS_PRODUCT_IDS.yearly;

export type FeatureId =
  | 'log_doses'
  | 'reminders'
  | 'pets'
  | 'protocols'
  | 'basic_recon'
  | 'basic_site_rotation'
  | 'local_storage'
  | 'full_map_history'
  | 'photos_labs_trends'
  | 'cloud_sync'
  | 'export_pdf'
  | 'advanced_inventory';

export type FeatureTier = 'free' | 'pro';

export type FeatureDef = {
  id: FeatureId;
  label: string;
  tier: FeatureTier;
  /** Soft free-tier limit when applicable. */
  freeLimit?: number;
};

/**
 * Free vs Pro capability matrix (Pins Pets).
 * Free keeps: log / reminders / 1 pet / basic recon / basic rotation / local storage.
 * Pro unlocks: unlimited pets, full map history, export/PDF, cloud sync,
 * advanced inventory, photos/labs/trends.
 */
export const FEATURE_MATRIX: FeatureDef[] = [
  { id: 'log_doses', label: 'Log doses', tier: 'free' },
  { id: 'reminders', label: 'Reminders', tier: 'free' },
  { id: 'pets', label: 'Pets', tier: 'free', freeLimit: 1 },
  { id: 'protocols', label: 'Protocols', tier: 'free', freeLimit: 1 },
  { id: 'basic_recon', label: 'Basic reconstitution calculator', tier: 'free' },
  { id: 'basic_site_rotation', label: 'Basic site rotation', tier: 'free' },
  { id: 'local_storage', label: 'Local encrypted storage', tier: 'free' },
  { id: 'full_map_history', label: 'Full map history', tier: 'pro' },
  { id: 'photos_labs_trends', label: 'Photos / labs / trends', tier: 'pro' },
  { id: 'cloud_sync', label: 'Cloud sync', tier: 'pro' },
  { id: 'export_pdf', label: 'Export / PDF', tier: 'pro' },
  { id: 'advanced_inventory', label: 'Advanced inventory', tier: 'pro' },
];

export const FREE_PET_LIMIT = 1;
export const FREE_PROTOCOL_LIMIT = 1;

/** Free users see map history within this many days; Pro sees all. */
export const FREE_MAP_HISTORY_DAYS = 14;

const ALWAYS_FREE: FeatureId[] = [
  'log_doses',
  'reminders',
  'basic_recon',
  'basic_site_rotation',
  'local_storage',
];

export type AccessResult =
  | { allowed: true; reason?: string }
  | { allowed: false; reason: string; feature: FeatureId };

export function getProductById(id: string): ProductStub | undefined {
  return ALL_PRODUCTS.find((p) => p.id === id);
}

export function getFeature(id: FeatureId): FeatureDef | undefined {
  return FEATURE_MATRIX.find((f) => f.id === id);
}

export function isAlwaysFreeFeature(feature: FeatureId): boolean {
  return ALWAYS_FREE.includes(feature);
}

/**
 * Soft gate from Free vs Pro matrix.
 * Basic dose log / site rotation are never hard-blocked.
 * Free = 1 pet (soft prompt when adding a 2nd).
 */
export function canAccessFeature(
  feature: FeatureId,
  opts?: { petCount?: number; protocolCount?: number; isPro?: boolean },
): AccessResult {
  const isPro = opts?.isPro ?? false;
  const def = getFeature(feature);

  if (ALWAYS_FREE.includes(feature)) {
    return { allowed: true, reason: 'Included on Free' };
  }

  if (feature === 'pets') {
    const limit = def?.freeLimit ?? FREE_PET_LIMIT;
    const count = opts?.petCount ?? 0;
    if (isPro || count < limit) {
      return { allowed: true };
    }
    return {
      allowed: false,
      feature,
      reason: `Free includes ${limit} pet. Upgrade to Pro for unlimited pets.`,
    };
  }

  if (feature === 'protocols') {
    const limit = def?.freeLimit ?? FREE_PROTOCOL_LIMIT;
    const count = opts?.protocolCount ?? 0;
    if (isPro || count < limit) {
      return { allowed: true };
    }
    return {
      allowed: false,
      feature,
      reason: `Free includes ${limit} protocol. Upgrade to Pro for unlimited protocols.`,
    };
  }

  if (def?.tier === 'pro' && !isPro) {
    return {
      allowed: false,
      feature,
      reason: `${def.label} is a Pro feature.`,
    };
  }

  return { allowed: true };
}

export function shouldPromptUpgrade(
  feature: FeatureId,
  opts?: { petCount?: number; protocolCount?: number; isPro?: boolean },
): boolean {
  return !canAccessFeature(feature, opts).allowed;
}

/** Count active (non-deleted) pets. */
export function countPets(pets: { deletedAt?: string | null }[]): number {
  return pets.filter((p) => !p.deletedAt).length;
}

/** Count unique compounds that have a schedule entry (a "protocol"). */
export function countProtocols(schedule: { compound: string; deletedAt?: string | null }[]): number {
  const names = new Set<string>();
  for (const row of schedule) {
    if (row.deletedAt) continue;
    if (row.compound) names.add(row.compound);
  }
  return names.size;
}
