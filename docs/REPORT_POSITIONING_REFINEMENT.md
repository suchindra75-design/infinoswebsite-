# INFINOS TECH: positioning refinement ("Smart Diagnostic Cold-Chain Technology")

This is a content and brand-positioning refinement within the existing implementation. Nothing else changed:
- the Editorial Stage design, dark background, product animations and camera;
- the scroll and performance system, the eight chapters, the 360° viewer and the intro.

All product claims still come from the official pitch deck through `src/content/platform.ts`. See `REPORT_PITCH_DECK_CONTENT.md` for the full cross-check and the claims that need confirmation.

## The three central ideas

Defined once in `platform.ts` (`PILLARS`) and used across the story and the sections:

| | Idea | What it covers |
|---|---|---|
| I | **Smart diagnostic transportation** | Portable, dual-temperature-zone sample collection and transport, home → laboratory/hospital |
| II | **Intelligent cold-chain technology** | PCM-based cooling approach, sensorised compartments with data logging, AIoT-enabled monitoring |
| III | **Healthcare impact** | Sample integrity, sustainable transportation, accessible diagnostic sample collection |

## What changed

| Where | Change |
|---|---|
| **Company category** | INFINOS Tech is now introduced as a **smart diagnostic cold-chain technology** company. Tagline (intro, mobile menu, footer): "Smart diagnostic cold-chain technology". Page title: "INFINOS Tech — Smart Diagnostic Cold-Chain Technology", with a matching meta description. |
| **Product introduction** (chapter 01) | Kicker: "Smart diagnostic cold chain". Headline: **"The diagnostic cold chain, made smart."** Body: a portable, dual-temperature-zone, AIoT-enabled container for diagnostic laboratory samples, from homes to laboratories and hospitals. |
| **Story acts** | Each chapter belongs to one idea, and the chapter index names it (e.g. `03 / 08 · II · Intelligent cold-chain technology`). 01–02 → I · 03–05 → II · 06–07 → III · 08 → all three. |
| **Chapter order** | For the acts to run in sequence, *Smart monitoring & data logging* moves to **05** (lid-open interior: lining and rack callouts, monitoring panel), and *Safety & sample integrity* moves to **07** (the display close-up; the on-board readout supports "integrity"). Camera, compositions and visuals are unchanged. |
| **Chapter 08** | "From doorstep to laboratory." Smart diagnostic transportation, intelligent cold-chain technology and healthcare impact, presented as one INFINOS system. |
| **New positioning overview** (first section after the story) | "Smart diagnostic cold-chain technology." with the company line and the three ideas, each linking to its section. |
| **Section order** | Follows the ideas: Applications (I) → Technology (II) → Impact (III) → Product range → Company → Contact. Navigation follows the same order. |
| **Applications** (I) | Kicker "I · Smart diagnostic transportation". Lede: portable, dual-temperature-zone collection and transport, each sample category at its own temperature. |
| **Technology** (II) | Kicker "II · Intelligent cold-chain technology". Lede: three layers around the dual-zone container (PCM-based cooling approach, sensorised compartments with data logging, AIoT-enabled monitoring). |
| **Impact** (III) | Kicker "III · Healthcare impact". Title: "Integrity, sustainability, access." Items reordered to sample integrity, alternative to single-use ice packs, sustainable transportation, accessible diagnostic collection. Reported and projected figures keep their qualifiers. |
| **Company** | Focus now reads "Smart diagnostic cold-chain technology". |

## Claims discipline (unchanged)

- **Cooling:** "PCM-based cooling approach" and "precise temperature maintenance" only. No "active regulation", no "non-electrical", no duration in the story.
- **6+ h** appears only in Technology, marked *Reported · validation pending*.
- **App features** (real-time monitoring, alerts, integrity verification, chain of custody) are marked *In development*, as the deck's own MVP plan states (p.10).
- **UV sanitisation and tamper-proof sealing** are worded as "designed with".
- **−10 °C** is an example configuration.
- **35% and ~500 t** carry *reported* / *projected at scale*.
- **No** certifications, sensor types, connectivity, battery or accuracy claims.

## Verification (production build)

| Check | Result |
|---|---|
| All 8 chapters on desktop 1440×900, tablet landscape 1180×820, tablet portrait 834×1194, phone 390×844, phone landscape 844×390 | Every chapter's text and figures fit their space (automated fit check); no console errors |
| Supporting sections (positioning, applications, technology, impact, range, company, contact) on desktop, tablet and phone | Rendered; no console errors |
| 360° viewer | 24/24 checks on desktop and on mobile; full rotation; scroll position restored |
| Reduced motion / no WebGL | Pass |
| Intro | Loader until 1.988 s, logo 2.004–3.988 s, product from 4.020 s; 0 overlap frames |
| Hero explore markers | Pass |
| Scroll performance, desktop | 0 dropped frames in 2,395; p99 16.8 ms; 0 long tasks; 369 React commits for the whole scroll |
| Build and lint | Production build compiles; TypeScript clean; ESLint 0 errors (1 old `<img>` warning in Nav) |

> **Correction (2026-10-13):** the 24-point viewer checklist (`viewer.mjs`) uses development-only test hooks, so it ran on the **development server**, not the production build. A command-line bug also made the run labelled "mobile" a desktop run. It has now been re-run correctly on the development server: **24/24 desktop and 24/24 mobile**. On the production build, the viewer was verified with `viewer_prod.mjs` (full 360° rotation, all four quadrants, scroll position restored, desktop and mobile) and the reduced-motion and no-WebGL checks.


Screenshots: `docs/screenshots/positioning/`, every chapter on all 5 layouts, contact sheets, and every section on desktop, tablet and phone.
