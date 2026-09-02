# Pins Pets

**Pet medication & injection tracker** — a clone of [Pins](https://github.com/Kdpomaski/Pins-App) rebuilt for dogs, cats, and other pets.

**Live app:** https://kdpomaski.github.io/Pins-Pets/

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

## Disclaimer

Pins Pets is a personal organization tool. It does not provide veterinary advice. Always consult a qualified veterinarian.
