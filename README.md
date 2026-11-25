# The Living Price Atlas (`LPA001`)

Public specification reader and consultation portal for **The Living Price Atlas**, hosted at [`livingpriceatlas.banezglobal.com`](https://livingpriceatlas.banezglobal.com/) under Bañez Global.

## Canonical Specification Provenance

- **Specification:** `LPA001` — Foundational Principles and Epistemic Framework
- **Version:** `1.0` (`November 25, 2026`, `Proposed for adoption`)
- **Verbatim file:** [`public/LPA001-v1.0.md`](public/LPA001-v1.0.md) and [`src/corpus/LPA001-v1.0.md`](src/corpus/LPA001-v1.0.md)
- **Canonical size:** `28,920` bytes (LF line endings)
- **Canonical SHA-256:** `a4cc1124dba29a55f9cf04c8e496d88852388a4a60987c1502333c625411ed0a`

## Local Development & Verification

```bash
npm install
npm test
npm run dev
```

`npm test` runs `src/tests/spec-fidelity.test.mjs`, TypeScript checking (`tsc --noEmit`), and the production Vite build (`vite build`).

## Pulse Messages Configuration

This repository contains zero secrets or hardcoded tenant IDs. To connect the feedback and support chat widget (`cdn.pulsemessages.com/widget.js`) at build time:

1. Copy `.env.example` to `.env.local` (ignored by Git):

   ```bash
   cp .env.example .env.local
   ```

2. Set `VITE_PULSE_CLIENT_ID` to the **Living Price Atlas** Pulse tenant's public `data-client-id`:

   ```dotenv
   VITE_PULSE_CLIENT_ID=<your-pulse-client-id>
   ```

When `VITE_PULSE_CLIENT_ID` is omitted, the site builds cleanly and shows a calm inline notice in place of the live widget popup.

## Firebase Hosting & Cross-Domain Google Sign-In

- **Firebase Project:** `xai-suite`
- **Hosting Target:** `livingpriceatlas` → `livingpriceatlas-xai-suite` (see `.firebaserc` and `firebase.json`)
- **Custom Domain:** `livingpriceatlas.banezglobal.com`

To enable 1-click Google Sign-In (`signInWithPopup`) inside the Pulse widget on the custom domain:

1. Ensure `livingpriceatlas.banezglobal.com` is listed in `pulse-messages` → **Firebase Authentication → Settings → Authorized domains**.
2. Keep the strict `Content-Security-Policy` in `index.html`, which permits `cdn.pulsemessages.com`, `apis.google.com`, `accounts.google.com`, `*.firebaseapp.com`, and `*.googleusercontent.com`.

Once `VITE_PULSE_CLIENT_ID` is set in `.env.local`, build and deploy:

```bash
npm test
firebase deploy --only hosting:livingpriceatlas --project xai-suite
```
