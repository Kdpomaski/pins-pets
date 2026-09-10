# Changelog

## Unreleased — L/R body map, edit shots, empty inventory (1.0.0 / iOS 7 / Android 6)

- Body map Left/Right flip (unflipped side = animal's right); site pins audited vs 3:2 artwork
- Side-view lateral sites are Left/Right pairs; old site ids still match for heatmaps
- Tap a saved dose → "Edit this dose?" → all fields + native date wheel → save
- Fresh inventory is empty; cannot log a shot until a compound is in Inventory
- SoftPaywall stays OFF (`VITE_PAYWALL_ENABLED` default false)
- Marketing 1.0.0; iOS `CURRENT_PROJECT_VERSION` 7; Android `versionCode` 6
- Units-per-dose chips stay U-100 syringe units (`volume_ml × 100`)

## Unreleased — tester: weight units, Android back exit, dose volume chips

- Pets enter/edit/display weight in lb or kg; stored value stays `weightKg` (lb converted on save)
- mg/kg calculator always uses kilograms
- Android system back exits at SPA root (do not use `history.length` / `canGoBack`); pops in-app history; closes overlays
- Inventory + Body Map / log dose show calculated draw volume next to frequency-dose when concentration + dose exist
- SoftPaywall stays OFF (`VITE_PAYWALL_ENABLED` default false)
- iOS `CURRENT_PROJECT_VERSION` 6; Android `versionCode` 5

## Unreleased — export / Android back / bottom safe-area

- Capacitor export uses Filesystem + Share for .ics and text (WebView download was a no-op)
- SoftPaywall stays OFF by default; export is not gated when paywall flag is false
- Android `backButton` handler (history back or exit)
- Android bottom safe-area floor so BottomNav clears system nav / gesture bar
- Keep Horse/Rabbit species, Bot Ross logo, and top safe-area scrollport
- Android versionCode 4+; iOS CFBundleVersion / CURRENT_PROJECT_VERSION 5+

## Unreleased — safe-area, Horse/Rabbit, logo fringe

- Respect safe-area insets with #root scrollport and 47px native top inset
- Horse and Rabbit selectable pet types with side and top body-map silhouettes
- Bot Ross cleaned logo ingest for store/in-app/iOS icons without white fringe

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
