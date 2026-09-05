# Changelog

## Unreleased — freemium Pro paywall stubs

- Add StoreKit 2 / Play Billing product ID stubs + soft paywall behind `VITE_PAYWALL_ENABLED` (default false)
- Free = 1 pet; soft upgrade after first real log; never hard-block basic dose log / site rotation
- Shared Pins + Pets Bundle entitlement stubs via Supabase account + Restore Purchases
- Website catalog deep link to 220bioworx.com only (no in-app commerce)
- RUO-safe placeholder copy; consult veterinarian; no medical claims


## 1.0.0 — 2026-08-28

Fork of Pins for pets.

- Multi-pet profiles (dog, cat, other)
- Species-specific body maps (side + top)
- Medication types: injection, oral, topical, insulin, vaccine
- Inventory forms: chew, tablet, topical, insulin, vaccine, vial
- mg/kg weight-based calculator
- Isolated localStorage keys so it does not collide with Pins
