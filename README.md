# The Living Price Atlas (`LPA001`–`LPA004`)

Public specification series reader and consultation portal for **The Living Price Atlas**, hosted under Bañez Global (`livingpriceatlas.banezglobal.com` / `livingpriceatlas-xai-suite.web.app`).

## Canonical Specification Manifest (`v1.0`, November 25, 2026)

| Specification | Title | Verbatim File | Bytes (LF) | SHA-256 |
|---|---|---|---:|---|
| `LPA001` | Foundational Principles and Epistemic Framework | `public/LPA001-v1.0.md` | `28920` | `a4cc1124dba29a55f9cf04c8e496d88852388a4a60987c1502333c625411ed0a` |
| `LPA002` | Domain Architecture and Foundational Inheritance | `public/LPA002-v1.0.md` | `45707` | `4214f463917b7297da20b058cbf4b11ae38c12f46d000a060fbd0927c33e90f3` |
| `LPA003` | The Contextual Cost Model | `public/LPA003-v1.0.md` | `56218` | `42535796e33e184f5c3007c716a4c55737da5f799c35b7413783a8da49e8f2ba` |
| `LPA004` | Contribution and Participation Protocol | `public/LPA004-v1.0.md` | `65839` | `af431791af9c1f5ca55bdfdfcb2f1fb1451c10c504388f07c456db39825953ff` |

### Architectural Figures (`public/figures/`)

| Figure | Path | Spec Section | Bytes | SHA-256 |
|---|---|---|---:|---|
| Figure 3.1 | `public/figures/LPA003-fig-01-economic-triangulation.png` | `LPA003 §14` | `80207` | `b9634546b56edd6f773ffa53ac17911a5ff457afd9e4b91121b4708968ace313` |
| Figure 3.2 | `public/figures/LPA003-fig-02-contextual-cost-model.jpg` | `LPA003 §20` | `60649` | `d56ee47200bfdca0aaad5b9b9f91d034b9cc9db92052db626e03924b39fef959` |
| Figure 4.1 | `public/figures/LPA004-fig-01-reciprocal-ecosystem.png` | `LPA004 §7` | `95641` | `2f4d4f5c69fc9c98e323ae9d769dda8434f25f9f43b8cf47da2e7e19692acdcd` |
| Figure 4.2 | `public/figures/LPA004-fig-02-anticipatory-demand-readiness.png` | `LPA004 §17` | `69955` | `a8c436fc687c506283ac7bc33f060acce118af8f833a26dbed0e9a64df01a0a1` |
| Figure 4.3 | `public/figures/LPA004-fig-03-participation-flywheel.png` | `LPA004 §26` | `67963` | `683171b96ed0649833eec49d12fbd35ddf59e591851b4bfda10034c594f31aa5` |

## Local Development & Verification

```bash
npm install
npm test
npm run dev
```

`npm test` runs `src/tests/spec-fidelity.test.mjs`, TypeScript checking (`tsc --noEmit`), and the production Vite build (`vite build`).

## Pulse Messages Configuration & Firebase Hosting

Copy `.env.example` to gitignored `.env.local` and set `VITE_PULSE_CLIENT_ID=<public-client-id>` before running `npm test` and deploying to `livingpriceatlas-xai-suite` under Firebase project `xai-suite`:

```bash
firebase deploy --only firestore:livingpriceatlas,hosting:livingpriceatlas --project xai-suite
```

## Section Reactions (`livingpriceatlas` Firestore Database)

Major sections (`Preamble`, `§1`–`§33`, `Closing Declaration`) include thumbs-up / thumbs-down controls persisted to the isolated named Firestore database `projects/xai-suite/databases/livingpriceatlas` (`sectionReactions/{voterHash}_{specId}_{sectionId}`). Security rules (`firestore.livingpriceatlas.rules`) enforce schema validation and `allow read, delete: if false;` so tallies remain private to the steward.

Stewards can list reaction counts at any time with an authorized OAuth token (`gcloud auth print-access-token`):

```bash
curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://firestore.googleapis.com/v1/projects/xai-suite/databases/livingpriceatlas/documents/sectionReactions?pageSize=200"
```
