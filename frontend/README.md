<<<<<<< HEAD
Caseblitz healthtech track
=======
# MedCheck — Frontend Prototype

A laptop-first, interactive frontend prototype for MedCheck, an AI-assisted
medication management and adherence platform.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- React Three Fiber / drei / three.js (the 3D pill hero)
- Framer Motion (scroll-driven / UI motion)
- Zustand (app state), persisted to `localStorage`

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`). Optimized for
1366×768 through 1920×1080 laptop viewports; mobile layout is intentionally
out of scope for this pass (see `54_scope` note below).

Demo account: any email + any password on `/login`, or continue as the
seeded demo user **Ramesh** (Type 2 Diabetes, Hypertension) with four
pre-loaded medications and one caregiver (Priya).

## Project structure

```
src/
  components/   reusable UI: navbar, sidebar, Pill3D, forms, rows
  layouts/      MarketingLayout (public site) and AppLayout (authenticated shell)
  pages/        one file per route
  hooks/        useAppState, useT (translation)
  services/     storage.ts (localStorage), store.ts (zustand state + actions)
  utils/        safetyEngine.ts, adherence.ts
  data/         demoData.ts (seed state)
  locales/      en.json, hi.json, mr.json
  i18n/         translation lookup
```

## What's implemented

- Full flow: landing → login/signup → optional profile setup → dashboard →
  medications → schedule → prescriptions → adherence → safety → caregiver →
  AI assistant → profile → settings.
- Scroll-driven 3D pill hero (React Three Fiber) that rotates on scroll and
  separates into two halves; a smaller version recurs between landing-page
  sections and on the auth screens.
- Hover-expandable desktop navbar.
- English / Hindi / Marathi UI strings via `locales/*.json`, switchable in
  the navbar and Settings, persisted in `localStorage`. Medication names,
  dosages and prescription-derived data are intentionally left untranslated.
- Medication CRUD, mock prescription upload → extraction → confidence-flagged
  review, dose marking (taken/missed), adherence charts, a small rule-based
  safety engine (interactions/duplicates on a curated demo dataset) with an
  OTC-checker, caregiver invite/permission toggles, and a scripted AI
  assistant with suggested prompts.
- All state persists to `localStorage`; **Settings → Reset demo data**
  restores the seeded Ramesh account.

## What's stubbed / next steps

- Prescription OCR, the safety engine and the AI assistant are mocked with a
  small curated dataset — swap `utils/safetyEngine.ts` and the assistant's
  response table for real services when ready.
- Only `en`/`hi`/`mr` keys used by the current UI are filled in; extend
  `src/locales/*.json` for any new copy.
- Mobile layout is out of scope per the brief; components are kept modular
  enough to add a mobile layout later without a rewrite.
>>>>>>> 0b528f1 (Initial commit)
