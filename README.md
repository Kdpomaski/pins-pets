# Pins Pets

**Pet medication & injection tracker** — a clone of [Pins](https://github.com/Kdpomaski/Pins-App) rebuilt for dogs, cats, and other pets.

**Live app:** https://kdpomaski.github.io/pins-pets/

Local-first, privacy-focused visual tracker for injections, oral meds, insulin, vaccines, topicals, inventory, and scheduling.

**Current release:** v1.0.0 (2026-08-28)

## Features

- **Multi-pet profiles** — name, species, breed, weight, sex
- **Species body maps** — dog, cat, and generic pet (side + top views); tap a site to log
- **Everyday vet meds** — injections, oral chews/tablets, insulin, vaccines, flea/tick topicals
- **Inventory** — vials, chews, tablets, insulin, remaining quantity
- **Schedule** — weekly dose calendar with export
- **Calculators** — reconstitution math + mg/kg weight-based dosing
- **PWA** — installable home-screen app
- **Security** — AES-256-GCM encrypted local storage, optional passphrase lock

## Privacy

Pet health data stays **encrypted on your device** by default. No personal health data is sent to servers unless you explicitly enable cloud backup (not yet available).

## Tech Stack

- React 19 + TypeScript + Vite 6
- Tailwind CSS v4
- Wouter, Zod, Web Crypto, Supabase Auth (optional beta)

## Getting Started

```powershell
cd "D:\220 TECH\Pep Stuff\Pins Pets\pins-pets"
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

Copy `.env.example` to `.env` if you want Supabase login. In dev, auth is skipped when env vars are empty.


## Freemium / Pro (stubs)

Pins Pets ships freemium with optional Pro. Soft paywall only — **basic dose log and site rotation are never hard-blocked**. Free includes **1 pet**.

Product ID stubs (do **not** create live IAP in App Store Connect / Play until Kevin money gate):

| SKU | Product ID | Display |
|---|---|---|
| Monthly | `com.two20tech.pinspets.pro.monthly` | $5.99/mo |
| Annual (primary) | `com.two20tech.pinspets.pro.yearly` | $49.99/yr |
| Lifetime | `com.two20tech.pinspets.pro.lifetime` | TBD |
| Bundle monthly | `com.two20tech.bundle.pro.monthly` | TBD |
| Bundle yearly | `com.two20tech.bundle.pro.yearly` | TBD |
| Bundle founding lifetime | `com.two20tech.bundle.pro.lifetime` | $79 (TestFlight) |

### Cross-app bundle (Pins + Pins Pets)

Purchase or restore in **either** app → local Pro flag → stub upsert to the signed-in **Supabase** account (`user_entitlements` / user metadata). The other app refreshes entitlement on launch / Restore / sign-in and unlocks Pro for both. Founding TF lifetime is the shared bundle SKU at **$79**.

### Feature flags

| Flag | Default | Meaning |
|---|---|---|
| `VITE_PAYWALL_ENABLED` | `false` | Soft paywall + Pro gating UI |
| `VITE_FOUNDING_LIFETIME` | `false` | Show founding bundle offer |
| `VITE_BILLING_MOCK` | `false` | Mock purchase/restore → local Pro (dev only) |

Website catalog deep links go to **https://www.220bioworx.com/products.html** only (RUO research materials). **No in-app peptide / pet-product checkout.**

Decision: `/workspace/bus/decisions/2026-09-03-app-monetization.md`

## Disclaimer

Pins Pets is a personal organization tool. It does not provide veterinary advice. Always consult a qualified veterinarian.
