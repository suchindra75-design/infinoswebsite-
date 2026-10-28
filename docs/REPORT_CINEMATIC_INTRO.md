# INFINOS TECH: cinematic intro

**Files**
- Code: `src/components/hero/IntroSequence.tsx` (structure and state machine) and `src/app/intro.css` (choreography).
- Recordings: `docs/recordings/`.
- Screenshots: `docs/screenshots/intro-cinematic/`.

All measurements below are from the **production build** (`next build && next start`) in Chrome.

## 1. What was studied

### The logo (442 × 352 reference image)
The mark was measured pixel by pixel. It has four layers:

| Layer | Geometry (units of the 411 × 327 outer rectangle) | Colour |
|---|---|---|
| Outer "shell" | Two coral bars: top 0–62, bottom 271–327. Black band in between. | `#CD6256` |
| Frame | Gold frame, outer 26–379 × 26–304, about 40 units thick | `#F3B953` |
| Core | Black core, 66–339 × 68–261 | `#000` |
| Wordmark | White lowercase "infinos", ink 79–337, baseline 186, x-height 52; small "TM" in the bottom bar | `#FFF` |

**Typeface:** I compared three candidates against the artwork. **Roboto Condensed Bold** matches it:

| Metric | Roboto Condensed Bold | Artwork |
|---|---|---|
| Width | 260.6 | 258 |
| Ascender | 74.9 | 75 |
| x-height | 52.0 | 52 |

It is self-hosted through the project's existing `next/font` setup, with no new package.

**The existing `public/logo.jpg` is only 100 × 80 px**, too small for a centrepiece. The mark is therefore rebuilt as crisp vector/HTML geometry from those measurements.

**Fidelity check** (`LOGO_fidelity_reference_vs_vector_vs_diff.png`): I rendered the static formed logo and compared it with the artwork pixel by pixel. Only **3.6 %** of pixels differ strongly, and these are all one-pixel anti-aliased edges. Proportions, letter positions and frame thicknesses line up.

### The old loader (Uiverse "speeder")
Reusable techniques:
- the shaking "speeder" vehicle (`speeder` keyframes);
- short exhaust streaks behind it (`fazer1–4`);
- screen-wide speed lines (`longfazers`);
- drifting clouds.

What I improved:
- **Generic rocket shape:** replaced with an INFINOS courier van carrying the nested-frame emblem.
- **Off-brand colours:** red and pink replaced with the brand coral and gold.
- **Cartoon clouds:** replaced with soft city bokeh.
- **Shake:** the 3 px jitter is now a sub-pixel road vibration.
- **Timing:** the endless loop now has a beginning, middle and end on a 2 s schedule.

## 2. Concept: "Encapsulation"

The logo is nested layers: an outer shell, an insulating frame, and a protected core. That is exactly how the INFINOS T-1 bag is built: outer bag, insulated inner box, payload. The animation tells that story:

| Time (s) | Beat |
|---|---|
| 0.0 – 0.5 | Dark studio while the page hydrates. |
| 0.5 – 1.15 | The night scene fades in. The INFINOS courier van drives in, with wheels spinning, a soft headlight, brand-colour energy trails, speed streaks and parallax bokeh. |
| 1.15 – 1.49 | The van cruises. The load meter shows the real frame-preload progress. |
| 1.49 – 1.82 | The van accelerates out to the right and its trail stretches. |
| 1.80 – 2.00 | The road's light line brightens and collapses into a single point at the screen centre. The loader is gone at 2.00. |
| 2.00 – 2.30 | **Ignition:** a flare and an anamorphic streak. A white-hot light line expands from the point. |
| 2.20 – 2.55 | The line splits into two and forms the **coral shell**: the bars unfold from the light and "cool" from white-hot to coral. The mark lies back in depth (3D, rotateX). |
| 2.44 – 2.85 | The **gold frame** locks in around the shell, one side after another from all four directions, also cooling from white-hot. Light sparks flash at the four corners. |
| 2.64 – 3.27 | The **payload**: the letters of "infinos" rise one by one inside the black core. The mark rises upright. |
| 2.86 – 3.40 | "INFINOS TECH" and the tagline set below, with a soft floor light under the mark. |
| 2.98 – 3.60 | A **specular reflection** sweeps across the mark. "TM" appears. The mark breathes with a slight 3D drift. |
| 3.45 – 3.98 | **The dive:** text and wordmark fade, then the camera plunges *through the black core*. The shell and frame rush past the screen edges and warp lines streak outward. The screen is fully dark by 3.98. |
| 4.00 → | **Product:** the sharp 2560×1600 frame of the real bag is revealed in the centre, as the studio light opens outward from it (iris) and the backdrop fades over 1.1 s. The scroll-driven MOVE layout then takes over unchanged. |

The transitions are causal, not cuts:
- The van's road light becomes the point the logo ignites from.
- The logo's own black core becomes the darkness the product emerges from.

## 3. Engineering

- **One clock.**
  - Every intro animation has an *absolute* delay in seconds since page load.
  - `IntroSequence` starts all of them at document-timeline time 0, which is navigation start, through the Web Animations API (`animation.startTime = 0`).
  - The phase state machine (loading → logo → outro → product → ready) runs on the same `performance.now()` clock.
- **Compositor only.**
  - Every animated property is `transform` or `opacity`, so the browser runs them off the main thread.
  - Large soft layers are kept small and scaled; the studio-light iris uses about 1/16 of the raster memory it would otherwise need.
- **Main-thread work moved out of the intro.**
  - **3D model:** it now mounts at the product reveal instead of at page load. Its ≈0.6 s compile previously landed at 1.7 s, inside the loader; it now runs during the compositor-driven reveal. If the opening frames are not ready when the logo starts, the model mounts at once as a fallback.
  - **Product fade-in:** now an overlay fade on the compositor instead of a per-frame JavaScript opacity update.
  - **Opening frame:** the 2560 px frame is decoded with `img.decode()` (off the main thread) before its first draw.
  - **Loader entrance:** starts after hydration (0.5 s) rather than at 0 s.
- **Reduced motion.**
  - Same schedule with no movement: the van is static, the logo appears fully formed with a fade at 2 s and fades out by 4 s, and there is no dive or iris.
  - The site-wide `prefers-reduced-motion` rule (all animations 0.01 ms) now exempts the intro. Before this fix, that rule completely hid the reduced-motion intro.
- **Responsive.**
  - The mark size is `clamp(200px, min(40vmin, 62vw), 400px)`, and the width-based `min(66vw, 340px)` on portrait screens.
  - The van and the text scale too, and the tagline wraps on phones.

## 4. Test results (production build)

### Phase timing and overlap
Sampled every frame in the page:

| Viewport | Loader visible | Logo visible | Product first visible | Overlap frames (loader + logo / logo + product / loader + product) |
|---|---|---|---|---|
| Desktop 1440×900 @2x | 0.26 – 1.985 s | 2.018 – 3.985 s | 4.018 s | 0 / 0 / 0 |
| Desktop (run 2) | 0.25 – 1.995 s | 2.011 – 3.979 s | 4.027 s | 0 / 0 / 0 |
| Phone 390×844 @3x | 0.24 – 1.996 s | 2.013 – 3.979 s | 4.030 s | 0 / 0 / 0 |
| Tablet 1024×1366 @2x | 0.24 – 1.988 s | 2.005 – 3.988 s | 4.021 s | 0 / 0 / 0 |
| Reduced motion | 0.26 – 1.986 s | 2.019 – 3.969 s | 4.019 s | 0 / 0 / 0 |

The `product-start` mark was at 4.001–4.016 s in every run.

### Smoothness
**Frame pacing, 0.6–4.0 s:**
- median 16.7 ms (60 fps);
- p95 17.0–17.6 ms.

**Long tasks between 0.5 s and 4.0 s:** none over 91 ms. Before the changes, there was a 620 ms model compile at 1.7 s.

**Remaining hitches:**
- In a freshly launched browser (cold GPU process), single hitches of up to ≈280 ms remain. They occur mostly before 0.6 s, during hydration and before the scene has faded in.
- Warm runs show ≤170 ms.
- The model compile (≈0.55 s) now happens at ≈4.8 s, underneath the compositor-run reveal.

### Logo fidelity
3.6 % of pixels differ from the reference artwork, all of them anti-aliased edges.

### Regression checks (protected features)

| Check | Result |
|---|---|
| MOVE (centre → left) | Product centre 0.499 → 0.374 → 0.284 (unchanged); down/up difference 0.0000 on desktop and phone |
| 8 chapters | Text, rail and product view in sync on desktop and phone |
| Wheel scrolling (normal and fast) | 0 blank frames down and up, including fast scrolling 50 ms after the scroll unlock |
| 360° viewer | 24/24 PASS (mobile); full rotation and scroll restore on desktop and mobile |
| Fallbacks | Reduced motion and no-WebGL pass |
| Build and lint | Production build compiles; `tsc` clean; ESLint 0 errors (1 old `<img>` warning in Nav) |

> **Correction (2026-10-13):** the 24-point viewer checklist (`viewer.mjs`) uses development-only test hooks, so it ran on the **development server**, not the production build. A command-line bug also made the run labelled "mobile" a desktop run. It has now been re-run correctly on the development server: **24/24 desktop and 24/24 mobile**. On the production build, the viewer was verified with `viewer_prod.mjs` (full 360° rotation, all four quadrants, scroll position restored, desktop and mobile) and the reduced-motion and no-WebGL checks.


The v0.3 GLB, both 2560×1600 sequences, the camera track, the MOVE layout and the chapters are unchanged.

## 5. Deliverables

- **Recordings** (`docs/recordings/`, H.264, 60 fps, 6.2 s, timecode burned in):
  - `intro_desktop_1440x900.mp4`
  - `intro_mobile_390x844.mp4`
  - `intro_tablet_1024x1366.mp4`
  - These are captured from the production build with Chrome's screencast and resampled to a constant 60 fps by frame timestamp. Headless capture can hold a frame for longer than real playback does.
- **Screenshots** (`docs/screenshots/intro-cinematic/`):
  - 14 beats per viewport (desktop, mobile, tablet);
  - contact sheets `SHEET_*.png`;
  - the logo fidelity comparison.
