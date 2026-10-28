# Report — Cinematic Industrial Luxury visual refinement

Audit, token system and section map: `docs/DESIGN_CINEMATIC_INDUSTRIAL_LUXURY.md`. Before = build of commit `5159022`;
after = this change. Screenshots: `docs/screenshots/redesign/` (before/after pairs, desktop and phone).

## 1. What changed, section by section

| Section | Before | After |
|---|---|---|
| Whole site | Near-black `#0a0b0e` everywhere; amber accent | Graphite, slate, ivory, soft white; steel accent; light/dark rhythm |
| Intro | Near-black; coral and gold bokeh, streaks, flares, progress bar | Deep graphite; the same light in ivory and steel. Logo mark, logotype and van livery unchanged; timeline unchanged |
| Product hero and story | Bag on a near-black void; dark lower body merges into the background | Lit graphite cyclorama shared by frames and live model: wall brighter at product height, floor falloff, key-light pool, vignette, fine grain. Baked contact shadows now read on the floor. Text scrims graphite instead of black |
| Exploded view, callouts, hotspots | Amber markers and numbers | Steel; unchanged geometry and motion |
| Coolant showcase | Same black studio, warm grey light pool | The same shared studio, a cool steel light pool; family headline in the new weight and tracking (its size stays: it is bound by the band between the navigation and the fan) |
| Positioning (company statement + industries) | Black; title-size statement; five equal columns | **Warm ivory**; display-size statement beside the lede; industries as an editorial composition — *Current products* (Healthcare & diagnostics) as the lead, *Potential applications* as a numbered index |
| Applications | Black | Warm ivory (hairline join with the statement) |
| Technology | Black | Slate graphite; figures unchanged, now on slate |
| Impact | Black | Soft white |
| Product range | Black; red stripe on the Sensorial illustration | Deep graphite studio, light pool behind the render; illustration band in steel |
| Gallery | Black | Slate graphite; layout and photo rules unchanged |
| Company | Black | Warm ivory |
| Ecosystem | Black with rounded light cards | Soft white; square white plates with a hairline edge |
| Contact + footer | Black | Deep graphite |
| Navigation | Gradient fading to transparent (a dark smear over light sections); amber "360° view" | One solid graphite bar with a hairline; steel "360° view"; links 0.7 rem |
| 360° viewer | Near-black backdrop | The shared studio |

Typography: section heads became a two-column editorial grid on large screens (label and title left, lede right);
display size reserved for the company statement and the contact title; ledes in the primary text colour; labels and
notes raised from 8–9.6 px to 11 px with AA contrast on every surface.

## 2. Deliberately unchanged

- **Product geometry, materials, colours, branding, component placement, lighting rig, camera paths, scale.** The
  hero and story composite pre-rendered Cycles frames (transparent film, shadow catcher) with the live model, calibrated
  to match at each hand-over. Blender is not installed here, so the frames cannot be re-rendered; any change to the live
  model's light or camera alone would show as a jump at the hand-overs. The presence of the product was improved in the
  studio both layers share. Environmental reflections and a re-composed camera need new frames.
- Light story chapters: the frames' shadow catcher and the text over the product assume a dark studio.
- Story chapter type sizes: tuned to fit beside and below the moving product (chapter-fit checks).
- Intro timeline, scroll engine, exploded view, component registry, coolant interaction and canvas optimisations, 360°
  viewer behaviour, gallery behaviour and consent rules, links, reduced motion, no-WebGL fallback, content and claims.

## 3. Files

- `src/app/globals.css` — tokens (palette, semantic, type scale, studio), surface tones, section shell and editorial
  head, industries composition, studio for stage/coolants/viewer, nav bar, accent and label sizes, ecosystem plates.
- `src/app/intro.css` — base colour and decorative light colours only.
- `src/components/sections/PlatformSections.tsx` — section tones, display head, kicker+title group, industries markup,
  steel band on the range illustration.
- `src/components/sections/GallerySection.tsx`, `EcosystemSection.tsx` — section tones.
- `src/content/platform.ts` — group headings for the industries composition (wording only).
- `public/textures/grain.png` — 160 px grain tile (25 KB) against gradient banding.
- `docs/DESIGN_CINEMATIC_INDUSTRIAL_LUXURY.md`, this report, `docs/screenshots/redesign/`.

## 4. Tests on the final build `yf89c_V_nYa4opBs97AHb`

All runs below used this exact build; its website inputs are byte-identical to the committed files. Baseline for
comparisons: the pre-redesign build of `5159022` (`dqq0bnMOgwJGdv9Y-vsAv`).

| Check | Result |
|---|---|
| Production build, TypeScript, ESLint | Pass. ESLint 0 errors, the 2 pre-existing warnings (files not touched) |
| Launch check | 0 blockers (the VentureRISE certificate stays open, not blocking) |
| Intro timing (desktop, phone, tablet portrait) | Loader 0.37–0.51 → 1.99 s, logo 2.01 → 3.98 s, product first visible 4.02–4.03 s; 0 overlap frames |
| Product scroll story, exploded view | Chapter text fits at 5 sizes (desktop, tablet landscape and portrait, phone, landscape phone); continuous-scroll screenshots at 4 sizes; no console errors |
| React commits, model requests | Same as baseline (`react-dom` 1, `@react-three/fiber` 0 while scrolling within the hold) |
| Repeated visits (5 reloads, story → coolants) | Heap 22.7–23.0 MB, same as baseline; canvases 3 |
| Coolant showcase | Stages at 6 sizes, 3D picks, keyboard, flow, cover, information column with nine rows at 5 sizes, wheel over the column: no console errors; selection works |
| Coolant family headline fit (8 sizes) | Identical to baseline: fits at 7 sizes; at 1280×720 the kicker sits 2 px under the navigation **in both builds** (pre-existing) |
| 360° viewer (desktop, mobile) | All 4 quadrants, scroll restored, no console errors or failed requests |
| Reduced motion | Story, coolants, viewer, gallery and logo row behave as before (no drift; static fallbacks) |
| No-WebGL | Bag fallback, coolant still images and selector, viewer message: as before |
| Gallery (each photo once) | 0 failures at 1440, 1024, 640, 390, 320 and reduced at 1440 and 390 |
| Ecosystem logo row, public and reduced modes | 0 failures at 5 sizes |
| Repeated visits through gallery and ecosystem | Heap 21.5–21.8 MB on 4 of 5 visits, one reading of 29.9 MB (visit 2) with no growth afterwards |
| Social links and Justdial listing | All clickable, new tab, `noopener noreferrer`, at 5 sizes |
| Legal name | INFINOSTECH PRIVATE LIMITED exactly, at 7 widths; 0 LLP mentions in the built page |
| WebKit (Safari's engine, via the test harness) | Full page desktop and mobile: no console errors. No-WebGL: fallbacks and coolant selector work. Sections and links desktop and mobile: 0 failures |

**Performance (frame timing, throttle-gated):** one continuous wheel journey per run (intro → whole bag story →
coolant section → sections, then hover and selection on the fan), baseline then final, each run preceded by 90 s at
CPU speed limit 100 % and sampled every 2 s (any dip discards the run). All 4 runs valid (100 % in all samples, charging).

| Run | Story frames · >20 ms · max · p95 | Coolants · after · hover/select | Long frames >50 ms |
|---|---|---|---|
| Desktop 1440×900@2, baseline | 3877 · 1 · 67 ms · 16.7 | 0 frames >20 ms throughout | 1 (y≈1237, s≈−11.6) |
| Desktop 1440×900@2, final | 3876 · 2 · 50 ms · 16.7 | 0 frames >20 ms throughout | 1 (same position) |
| Phone 390×844@3, baseline | 5450 · 1 · 33 ms · 16.7 | 0 frames >20 ms throughout | 0 |
| Phone 390×844@3, final | 5451 · 1 · 33 ms · 16.7 | 0 frames >20 ms throughout | 0 |

Same draw calls per frame, no shader stalls, no console errors. The static studio, grain and section backgrounds add no
measurable frame cost.

**Regression found and fixed during testing:** the coolant family headline was first enlarged; at 1180×820 and
1280×720 it then overlapped the fan. Its size was restored to the original (only weight and tracking changed); the fit
is now identical to the baseline at all 8 sizes.

**Visual inspection:** every major section was inspected at 1440×900 and 390×844 (and 1920×1080, 820×1180) on the
final build — see `docs/screenshots/redesign/`.

**Not verified:** the Safari application itself and real phones/tablets (WebKit was exercised through the test
harness only). The CPU was throttled down to 35 % at times during the functional checks; they test behaviour, not
speed (frame timing above comes only from the gated runs).
