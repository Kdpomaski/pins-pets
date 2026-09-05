/**
 * Soft paywall / upgrade copy — Pins Pets.
 * No veterinary claims. No in-app peptide sales.
 * Website catalog CTAs deferred (Kevin 2026-09-05).
 */

export const PAYWALL_COPY = {
  headline: 'Unlock Pins Pets Pro',
  subhead: 'Track every pet with sync, exports, and advanced inventory. One pet, 2 protocols, and map history stay free.',
  reassure:
    'You can still log treatments for 1 pet, keep 2 protocols, full map history, reminders, and site rotation without upgrading.',
  ctaPrimary: 'Continue — $49.99/year',
  ctaPrimarySub: 'Best value · about $4.17/mo · cancel anytime',
  ctaMonthly: 'Monthly — $4.99/mo',
  ctaLifetime: 'Lifetime — TBD once',
  restore: 'Restore purchases',
  continueFree: 'Not now',
  continueFreeAlt: 'Continue with Free',
  legalRow:
    'Auto-renewing subscriptions billed by Apple or Google. Cancel anytime in your store account settings. Pins Pets is a personal organization tool — not a veterinary device and not a substitute for a veterinarian.',
  disclaimer:
    'Pins Pets is a personal organization tool from 220 Tech LLC. It is not a veterinary device and does not replace a veterinarian. Always consult a qualified veterinarian. Nothing in this app sells products or offers veterinary treatment.',
  noInAppSales: 'Pins Pets never sells peptides or pet products inside the app.',
  publisherNote: 'Published by 220 Tech LLC.',
} as const;

export const PRO_BULLETS = [
  'Unlimited pets (Free includes 1)',
  'Unlimited protocols (Free includes 2)',
  'Photos, labs & trends',
  'Cloud sync',
  'Export / PDF',
  'Advanced inventory',
] as const;

export const FREE_BULLETS = [
  'Log treatments & reminders',
  '1 pet',
  '2 protocols',
  'Full map history',
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
    'Sync, export / PDF, advanced inventory, photos & labs',
    'Founding price — TestFlight only',
  ] as const,
  cta: 'Unlock both apps — $39.99 lifetime',
  badge: 'Founding · TestFlight · Both apps',
  pushAnnual: 'Or go annual in this app — $49.99/year',
  entitlement:
    "Bundle unlocks Pro in both apps on the same signed-in account. Restore purchases in either app if Pro doesn't show.",
} as const;

export const CONTEXT_COPY = {
  afterFirstLog: {
    title: 'Unlock Pins Pets Pro',
    body: 'Track every pet with sync, photos & labs, and exports. One pet, 2 protocols, and full map history stay free.',
    cta: 'See Pro plans',
    dismiss: 'Not now',
  },
  secondPet: {
    title: 'Add another pet?',
    body: 'Free includes 1 pet. Pins Pets Pro unlocks unlimited pets, sync, and exports.',
    cta: 'See Pro plans',
    dismiss: 'Keep 1 pet',
  },
  secondProtocol: {
    title: 'Need another protocol?',
    body: 'Free includes 2 protocols. Pins Pets Pro unlocks unlimited protocols, sync, and exports.',
    cta: 'See Pro plans',
    dismiss: 'Keep 2 protocols',
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
} as const;
