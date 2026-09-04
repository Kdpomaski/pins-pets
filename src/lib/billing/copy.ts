/**
 * Soft paywall / upgrade copy — Pins Pets.
 * Sources:
 * - /workspace/bus/drafts/2026-09-03-paywall-copy-pins-pets.md
 * - /workspace/bus/drafts/2026-09-03-paywall-ui-strings.md
 *
 * RUO-safe. Consult veterinarian. No medical claims. No in-app peptide sales.
 */

export const PAYWALL_COPY = {
  headline: 'Unlock Pins Pets Pro',
  subhead: 'Track every pet with fuller history and exports. One pet stays free.',
  reassure:
    'You can still log treatments, set reminders, and rotate sites for your free pet without upgrading.',
  ctaPrimary: 'Continue — $49.99/year',
  ctaPrimarySub: 'Best value · about $4.17/mo · cancel anytime',
  ctaMonthly: 'Monthly — $5.99/mo',
  ctaLifetime: 'Lifetime — TBD once',
  restore: 'Restore purchases',
  continueFree: 'Not now',
  continueFreeAlt: 'Continue with Free',
  browseCatalog: 'Research catalog (website)',
  browseCatalogHint:
    'Browse Research Use Only lab materials on 220bioworx.com — not sold inside this app. Not for pet clinical use.',
  legalRow:
    'Auto-renewing subscriptions billed by Apple or Google. Cancel anytime in your store account settings. Pins Pets is a personal organization tool — not a veterinary device and not a substitute for a veterinarian.',
  disclaimer:
    'Pins Pets is a personal organization tool from 220 Tech LLC. It is not a veterinary device and does not replace a veterinarian. Always consult a qualified veterinarian. Any research materials on 220bioworx.com are Research Use Only — not for human or animal clinical use — and are never sold inside this app.',
  noInAppSales: 'No peptide or pet-product sales in-app. Product commerce stays on 220bioworx.com.',
  publisherNote: 'Published by 220 Tech LLC.',
} as const;

export const PRO_BULLETS = [
  'Unlimited pets (Free includes 1)',
  'Unlimited protocols',
  'Full map history',
  'Photos, labs & trends',
  'Cloud sync',
  'Export / PDF',
  'Advanced inventory',
] as const;

export const FREE_BULLETS = [
  'Log treatments & reminders',
  '1 pet',
  'Basic recon & site rotation',
  'Local encrypted storage',
] as const;

export const BUNDLE_COPY = {
  headline: 'Founding: Pins + Pets Pro',
  subhead:
    'One $39.99 lifetime unlock for both apps on TestFlight. Annual Pro is still the best everyday plan.',
  bullets: [
    'Pro in Pins and Pins Pets',
    'Unlimited protocols (and unlimited pets in Pets)',
    'Full history, sync, export / PDF, advanced inventory',
    'Founding price — TestFlight only',
  ] as const,
  cta: 'Unlock both apps — $39.99 lifetime',
  badge: 'Founding · TestFlight · Both apps',
  pushAnnual: 'Or go annual in this app — $49.99/year',
  entitlement:
    'Bundle unlocks Pro in both apps on the same signed-in account. Restore purchases in either app if Pro doesn\'t show.',
} as const;

export const CONTEXT_COPY = {
  afterFirstLog: {
    title: 'Unlock Pins Pets Pro',
    body: 'Track every pet with fuller history and exports. One pet and basic logging stay free.',
    cta: 'See Pro plans',
    dismiss: 'Not now',
  },
  secondPet: {
    title: 'Add another pet?',
    body: 'Free includes 1 pet. Pins Pets Pro unlocks unlimited pets, history, and exports.',
    cta: 'See Pro plans',
    dismiss: 'Keep 1 pet',
  },
  exportLocked: {
    title: 'Export with Pins Pets Pro',
    body: 'Share clean .ics, text, or PDF records when you want a backup or a handoff for your veterinarian.',
    cta: 'Unlock exports — from $49.99/yr',
    dismiss: 'Not now',
  },
  genericPro: {
    title: 'This is a Pro feature',
    body: 'Sync, photos, labs, trends, and advanced inventory are included with Pins Pets Pro.',
    cta: 'Unlock Pro',
    dismiss: 'Continue with Free',
  },
  lowInventory: {
    body: 'Running low in-app? Check the research catalog on our website.',
  },
} as const;
