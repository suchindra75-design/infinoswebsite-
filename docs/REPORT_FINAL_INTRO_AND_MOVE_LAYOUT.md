# INFINOS TECH — Final intro and animated product layout ("MOVE")

All results below were measured in headless Chrome against the **production build** (`next build && next start`).
The screenshots are in `docs/screenshots/final-move/`, with `SHEET_*.png` contact sheets.

## 1. Opening intro: exactly 4 s

| Phase | Time (from page load) | What is on screen |
|---|---|---|
| loading | 0.00 – 2.00 s | Dark screen with the INFINOS mark and a preload bar. The product is hidden. |
| logo | 2.00 – 3.45 s | The INFINOS TECH logo fades, scales (0.92 → 1) and rises into view, then holds. |
| outro | 3.45 – 4.00 s | The logo fades out and scales up slightly. It is fully gone at 4.00 s. |
| product | 4.00 s → | The product reveal begins, centred, from the 2560×1600 reveal sequence (visibility only, already sharp). |
| ready | ≈ 5.1 s | Scrolling unlocks and the navigation appears. |

**Implementation (`src/components/hero/IntroSequence.tsx`)**
- The whole intro runs from one `requestAnimationFrame` loop on the wall clock (`performance.now()`, i.e. time since page load).
- The previous GSAP timeline drifted by up to 0.2 s when the main thread was busy, because GSAP's lag smoothing slows its clock. The wall-clock loop cannot drift.
- Each phase starts only after the previous one has finished, so the phases never skip, overlap or reverse.
- The live 3D model now mounts at page load, hidden. Its compile long tasks (≈ 0.5 s) finish within the 0–2 s loading phase instead of landing near the 2 s or 4 s boundaries.
- At 4 s the reveal starts if either the opening frames or the live model can show the product. Frames are normally ready at ≈ 0.5–0.9 s. If neither is ready, it waits, up to a 10 s safety limit.

**Measured in production (rAF-sampled, runs without screenshots):**

| Viewport | Logo first visible | Logo gone | `product-start` mark | Frames with both logo and product visible |
|---|---|---|---|---|
| Desktop 1440×900 @2x (run 1) | 2.02 s | 4.00 s | 4.016 s | 0 |
| Desktop 1440×900 @2x (run 2) | 2.02 s | 4.00 s | 4.015 s | 0 |
| Desktop 1440×900 @2x (run 3) | 2.20 s* | 4.01 s | 4.007 s | 0 |
| Desktop 1440×900 @2x (final build) | 2.15 s* | 4.01 s | 4.014 s | 0 |
| Phone 390×844 @3x | 2.00 s | 4.00 s | 4.003 s | 0 |
| Tablet 1024×1366 @2x | 2.01 s | 4.01 s | 4.004 s | 0 |

\* In 2 of 6 runs the first frame drawn after 2.00 s came late, because a main-thread task was running at that moment. The animation is clock-driven, so it catches up: the logo is fully visible at 2.60 s and gone at 4.00–4.01 s in every run.

The logo is visible (>50 % opacity) for 1.62–1.67 s; its whole animation spans 2.0 s.

Taking screenshots during a run stalls Chrome's rendering, which shifts the sampled times by 0.1–0.3 s. Timing is therefore measured in runs without screenshots.

## 2–3. Product reveal and the scroll-driven centre-to-left move

- The bag is revealed **centred in the full viewport**, using frame 0 of the 2560×1600 reveal sequence.
- As you scroll (global progress 0.002 → 0.07, about one screen height), it moves into the **left product stage** and its scale eases to fit (×0.9).
- On phones and portrait tablets it moves into the **top 56 %** instead, and the story comes in below.

**How it works:**
- `filmLayout(W, H, pose, split)` in `src/motion/sequences.ts` interpolates a *virtual stage*, from the full viewport to the left 58 % (or the top 56 %).
- The amount comes from `splitAmount(progress)` in `src/motion/chapters.ts`: a smoothstep of the same single scroll progress that drives everything else. No timers are involved.
- The image-sequence canvas (`drawImage`) and the live camera (`setViewOffset`) use the **identical** layout, so frames and model stay locked together.
- The canvases never resize, so nothing jumps or resets. A `clip-path` on the stage closes in with the move, so close-ups end at the stage edge rather than running under the text.
- The right-hand story column fades and slides in, driven by the same amount: it starts at ≈ 0.03 progress and is fully in at 0.06.
- Portrait screens cap the film height at 1.6 × the screen width, so the centred bag is never cropped.
- The time-based "settle" width transition from the previous version has been removed.

**Measured on the product's pixels (alpha centroid of the sequence canvas), desktop 1440×900:**

| Progress | 0 | 0.02 | 0.03 | 0.04 | 0.05 | 0.06 | 0.07 |
|---|---|---|---|---|---|---|---|
| Product centre (fraction of width) | 0.499 | 0.462 | 0.421 | 0.374 | 0.330 | 0.296 | 0.284 |
| Story column opacity | 0 | 0 | 0.03 | 0.37 | 0.79 | 0.98 | 1 |

- **Phone 390×844:** the product centre moves vertically from 0.51 to 0.30 of the height, and the story comes in below.
- **Scrolling back up** reproduces exactly the same picture at each progress value (max down/up difference **0.0000** on desktop and on phone).

## 4. Synchronised chapters

There is one scroll progress; the editorial ranges are in `STORY_RANGES` (`src/motion/chapters.ts`), and the copy in `src/content/story.ts`:

| # | Chapter | Progress | Product at that point |
|---|---|---|---|
| 01 | Product overview | 0 – 0.19 | Reveal (centre → left), then the interactive hero |
| 02 | Exterior construction | 0.19 – 0.31 | Close-ups of the flap, display side and front |
| 03 | Thermal insulation | 0.31 – 0.393 | Flap and padded inner lid lift (photoreal) |
| 04 | Opening flap & compartments | 0.393 – 0.456 | Front panel drops: two compartments |
| 05 | Removable inner box | 0.456 – 0.518 | The inner box slides out of the lower compartment |
| 06 | Reflective lining & internal rack | 0.518 – 0.69 | The reflective lid opens; looking down onto the lining and rack |
| 07 | Display & monitoring | 0.69 – 0.83 | The bag closes; close-up of the side OLED |
| 08 | Complete product presentation | 0.83 – 1.0 | Labelled exploded overview, with 360° VIEW and CONTACT |

At each chapter's midpoint, on desktop (1440×900), phone (390×844) and tablet (1024×1366):
- the visible text is that chapter at full opacity;
- the rail shows the matching number;
- the product shows the matching view (frames for 03–05, live model for the rest).

**Copy rules:**
- "Removable" follows your chapter brief. The unverified word "insulated" has been removed from the exploded-view label and the hotspot text.
- Insulation materials, thermal performance, sensors and connectivity are still marked "not yet specified".

## 5. Preserved functionality, re-tested

| Check | Result |
|---|---|
| Camera continuity at chapter edges (0.01 … 0.83) | Max position jump 3e-9; reverse-scroll difference 0; camera never inside the bag |
| Wheel scrolling (normal and fast), down and up | 0 blank frames, all 8 phases, no console errors |
| 360° viewer (production, desktop and mobile) | Full 360° coverage, all four quadrants, scroll restored |
| 360° viewer test suite (mobile) | 24/24 PASS |
| Reduced motion | Product canvas, viewer and contact section work |
| No WebGL | Fallback image and viewer message shown; page works |
| Lint and type check | `tsc` clean; ESLint 0 errors (1 old `<img>` warning in Nav) |
| Production build | Compiles successfully |

> **Correction (2026-10-13):** the 24-point viewer checklist (`viewer.mjs`) uses development-only test hooks, so it ran on the **development server**, not the production build. A command-line bug also made the run labelled "mobile" a desktop run. It has now been re-run correctly on the development server: **24/24 desktop and 24/24 mobile**. On the production build, the viewer was verified with `viewer_prod.mjs` (full 360° rotation, all four quadrants, scroll position restored, desktop and mobile) and the reduced-motion and no-WebGL checks.


The v0.3 GLB, all rendered frames (both 2560×1600 sequences) and the camera track are unchanged.
