# INFINOS TECH: product experience redesign and scroll performance

All results below were measured on the **production build** (`next build && next start`) in Chrome.

The "before" figures come from the previous release (`infinos-website-cinematic-intro.zip`), rebuilt and measured with the same scripts on the same machine.

Unchanged by this work:
- The 0–4 s intro: courier loader → INFINOS logo → product.
- The v0.3 GLB.
- Both 2560×1600 image sequences.
- The 360° viewer, navigation, contact, and the reduced-motion and no-WebGL fallbacks.

---

## 1. Why the scrolling felt bad: the measured causes

I measured before changing anything. The method was a steady wheel scroll through the whole story on the production build, recorded with Chrome tracing, a per-frame timer and a React-commit counter.

| Before (desktop, 1440×900 @2x) | Value |
|---|---|
| Frames slower than 34 ms | 190 (≈ one every 0.25 s) |
| p95 frame time | 66.7 ms (4 frames dropped at once) |
| Main-thread long tasks | 190, totalling 13.8 s |
| React commits | 31,700 (≈ 640 per second) |
| Work while idle (5 s, not scrolling) | 1.4–1.8 s of main-thread time; 77,000–91,000 draw calls |

The trace showed four causes, in order of impact:

1. **Synchronous image decoding: 91% of all long-task time.**
   - Each new photoreal frame (a 2560 px WebP) was drawn from an `<img>`.
   - Chrome then decodes it *inside the frame commit*, on the main thread, taking about 70 ms per frame (`Decode Image` inside `RasterCHROMIUM`).
   - The page froze on almost every frame change in the two photoreal chapters.
2. **Scroll progress lived in React state.**
   - The product scene component re-rendered on every scroll frame.
   - That re-rendered the entire three.js scene graph through React Three Fiber, and the story column re-rendered all eight chapters, about 14 commits per frame.
3. **Rendering that never stopped.**
   - The WebGL canvas ran continuously (`frameloop="always"` plus a time-based idle camera drift), even with nobody scrolling.
   - A 1024 px contact-shadow pass re-rendered every frame.
   - The full-screen canvas used up to 1.75× device pixels with MSAA.
4. **Smaller costs:**
   - A CSS `brightness()` filter on a full-screen canvas.
   - `backdrop-filter` blur on fixed elements over the moving canvas.
   - Several independent `requestAnimationFrame` loops: Lenis/GSAP, React Three Fiber, the frame canvas and the intro. The text, frames and 3D could therefore land on different frames.

Lenis and GSAP ScrollTrigger themselves were integrated correctly: one trigger, driven from GSAP's ticker, with no duplicate listeners.

## 2. How the problems were fixed

| Fix | Where |
|---|---|
| **One frame loop.** Lenis runs first in GSAP's ticker (prioritised), so the scroll update reaches the store before anything draws. A single renderer list then draws the editorial text, the photoreal frame and the 3D scene in that same frame. Nothing draws unless something changed; idle means zero work. | `src/motion/frameLoop.ts`, `SmoothScrollProvider.tsx` |
| **Off-main-thread frame decoding.** Compressed frames are fetched once (24 MB desktop, 11 MB phone). A bounded window of decoded `ImageBitmap`s follows the scroll position, decoding ahead in the scroll direction and evicting the farthest frames first: at most ≈180 MB desktop, ≈64 MB phone. | `src/components/sequence/ImageSequence.tsx` |
| **No main-thread resize.** `createImageBitmap` resize options make Chrome scale the bitmap on the main thread (≈50 ms per frame on phones). Frames are decoded at native size, and each screen loads the frame set closest to its needs: 2560 px or 1600 px. | same |
| **Cheap draws.** Frames are drawn at about 1:1 scale, so bilinear filtering replaces the slow "high" resampling. This alone removed the last dropped frames; sharpness is unchanged (Laplacian variance 27.5 before vs 26.7 after on the opening frame). The exposure match is applied inside the canvas instead of as a CSS filter. | same |
| **3D renders only when visible and changed.** `frameloop="never"`, rendered by the frame loop through R3F `advance()`. Whether the live layer is visible is decided per tick, so it shows the current pose the moment it appears, never a stale image. DPR is capped at 1.5. The contact shadow re-renders only when the opening pose changes. The idle drift is removed. | `ProductCanvasInner.tsx`, `liveLayer.ts`, `CameraController.tsx` |
| **No per-frame React renders.** Components subscribe only to booleans that flip; all scroll-linked styles are written directly by the frame loop. | `ProductScene.tsx`, `ComponentLabels.tsx`, `StoryOverlay.tsx` |
| **Stable label roots.** drei `<Html>` labels get a stable portal. They used to unmount their own React roots during a render, producing 13 React warnings in development. | `Hotspots.tsx`, `ComponentLabels.tsx` |
| **No blur over the canvas.** `backdrop-filter` removed from the navigation, the 360° button and the explore note. | `globals.css` |

### Result (production, same machine and scripts)

| Desktop 1440×900 @2x, steady scroll | Before | After |
|---|---|---|
| Frames slower than 20 ms | 200 of 2,378 | **1 of 2,415** |
| Frames slower than 34 ms | 190 | **0** |
| p95 / p99 frame time | 66.7 / 66.7 ms | **16.7 / 16.8 ms** |
| Main-thread long tasks | 190 (13.8 s) | **0** |
| React commits during the whole scroll | 31,692 | **369** |
| Idle 5 s: main-thread time / draw calls | 1,788 ms / 91,200 | **146 ms / 0** |

**Other runs after the fix, at low machine load:**

| Run | Dropped frames | Long tasks |
|---|---|---|
| Desktop, reverse | 0 of 2,172 | 0 |
| Desktop, fast scroll | 0–2 of about 850 | 0 |
| Tablet portrait 834×1194 | 1 of 3,159 | 0 |
| Phone 390×844 @3x | 0 of 3,211 | 0 |
| Phone, reverse | 0 of 2,543 | 0 |

- **Noise caveat:** the test Mac was running other heavy apps, with load averages between 6 and 88. Runs made at higher load show scattered dropped frames in chapters whose code did not change; the same build gave 0, 9 and 106 dropped frames at load 6.7, 5.8 and 11.6. Clean-run figures are reported above, and the correlation is stated openly.
- **JS heap:** 22–38 MB during scrolling.

## 3. References studied

| Reference | What was taken (principles, not designs) |
|---|---|
| **Apple, AirPods Pro page** (reviewed in the browser) | The product is huge and central, with a two-line headline in the free space and a small product name above it. One idea per section. "Take a closer look" reveals one feature at a time. Restrained motion that follows the product. |
| **Teenage Engineering, OP–1 field** (reviewed) | Quiet, confident copy. An object-like product presentation with generous neutral space. Fine monospaced technical labels as texture. Strict type and colour discipline. |
| **Awwwards Sites of the Day** (listing reviewed; the thumbnails did not load) | General SOTD principles: editorial grids, large type with tight tracking, scroll-linked transitions that feel physically connected, and a single hero object. |
| Premium hardware and medical-device presentation | Hairline technical callouts used sparingly; credibility through precision rather than decoration. |

## 4. Three directions, one choice

Mock-ups with the real rendered frames on the existing background are in `docs/design/concepts_A_monument_B_editorial_C_specimen.png`.

| Direction | Hierarchy | Product visibility | Storytelling | Verdict |
|---|---|---|---|---|
| **A: Monument.** Product always centred; one oversized centred headline. | Strong but identical every chapter | Excellent | Repetitive; in tight shots the headline collides with the product | Rejected |
| **B: Editorial Stage.** The product is composed off-centre per chapter, moving with the camera; headline in the negative space; 1–2 hairline callouts locked to real features. | Clear: headline → one line → callout | Excellent: the product never shrinks below a heroic size | Each chapter gets its own composition, and the camera moves connect them | **Selected** |
| **C: Specimen Sheet.** Technical catalogue: grid, many annotations, spec tables. | Busy | Product too small | Reads as an engineering dashboard | Rejected |

## 5. What changed visually

- **The background is kept exactly:** the deep charcoal studio, the soft radial light around the product and the understated shadows.
  - Legibility "scrims" deepen the same charcoal behind the text only, scroll-linked.
  - The background colours and gradient themselves are untouched.
- **Removed:**
  - the fixed right-hand information panel;
  - the chapter-number rail;
  - the dividing lines;
  - the fact tables;
  - the boxed explore card.
- **Composition track** (`src/motion/composition.ts`): a pure function of scroll progress that places the product on screen per chapter.
  - Moves happen together with camera moves, eased with zero velocity at each key, so the product glides and never jumps.
  - Photo frames and live 3D use the identical layout.
  - **Desktop and tablet landscape:**
    - 01–02: product right, text left.
    - 03–05: product left, text right.
    - 06: product right.
    - 07: product left.
    - 08: centred-right.
  - **Tablet portrait and phone:** the product sits in the upper area with the chapter below it, in distinct tracks rather than a shrunk desktop.
  - Screens narrower than 16:10 keep the product's horizontal footprint, so the text always has its column.
- **Film-edge "pin":** 81 of the 120 open-sequence frames crop the raised flap, lid and body at the top of their film. While those frames can be on screen, the film top is held at or above the screen top, so a film edge never shows as a hard cut.
- **Typography** uses the existing font families, with no new downloads:
  - Large DM Sans headlines (400, −0.035 em tracking).
  - IBM Plex Mono kicker with index (`03 —— THERMAL INSULATION`).
  - Muted body text.
  - Rare mono notes stating what is *not yet specified*.
- **Callouts:** a 10 px ring with a hairline and a mono label, projected onto real model points through the same camera and composition.
  - They track the product exactly during camera moves.
  - Labels point away from the text and flip near screen edges.
  - Phones show one short label at a time.
- **Camera:** the live detail, interior and display views were re-framed as calmer three-quarter views:
  - a wide pass between the flap and the side panel;
  - interior views composed around bag and box together.
  - The photoreal sequences and every chapter-boundary pose are unchanged.
- **Chapter index:** `03 / 08 THERMAL INSULATION` plus a hairline progress line, bottom-right on desktop and top-left on portrait screens.
- **Hero explore note:** clicking a marker turns the bag toward the feature and replaces chapter 01's text in the same place and type.
- **Chapter 08:** "One carried system." with **Explore in 360°** and **Contact**.

### The chapters

| # | Product presentation | Headline |
|---|---|---|
| 01 | Revealed centred (the 4 s opening), glides right; interactive hero with explore markers | Temperature-controlled transport, carried. |
| 02 | Three-quarter flap view → wide front-right pass → side panel; callouts: quilted flap, padded side panel | Built in padded layers. |
| 03 | The photoreal opening: the flap and padded inner lid lift; callout: padded inner lid | Padded on every side. |
| 04 | Front panel drops; callouts: upper compartment, drop-down front panel | Two ways in. |
| 05 | The inner box slides out; callout: removable inner box | The inner box lifts out. |
| 06 | Its reflective lid opens, then a top-down view of lining and rack; callouts: reflective lining, perforated rack 12 × (3 + 4) | Lined in silver. Ordered within. |
| 07 | The bag closes; three-quarter side view of the display; callout: OLED readout | The readout, on the side. |
| 08 | Labelled exploded overview, then 360° and contact | One carried system. |

Copy remains limited to verified facts. "Removable" follows your chapter brief. Insulation materials, thermal performance, sensors and connectivity are labelled "not yet specified".

## 6. Tests that passed (production build)

| Check | Result |
|---|---|
| Camera continuity at all chapter edges | Max jump 3×10⁻⁹. On-screen product position jumps at edges ≤ 0.025 px; largest move 5.7 px per 0.025% of scroll. Reverse scroll identical. Camera never inside the bag (min distance 3.13). |
| Wheel scrolling, normal and fast, down and up | 0 blank frames. The live camera never exceeds the track's own speed (no stale-frame jumps). |
| Every chapter, 4 layouts | Screenshots: desktop 1440×900, tablet landscape 1180×820, tablet portrait 834×1194, phone 390×844. No console errors. |
| Hero explore markers | Click turns the bag; the explore note replaces chapter 01; no errors. |
| 360° viewer | 24/24 checks on desktop and on mobile; full rotation; scroll position restored. |
| Reduced motion / no WebGL | Pass (no-WebGL shows the product fallback and the viewer message). |
| Intro | Loader until 1.995 s, logo 2.012–3.978 s, product from 4.028 s; 0 overlap frames. |
| Build and lint | Production build compiles; TypeScript clean; ESLint 0 errors (1 old `<img>` warning in Nav). |

> **Correction (2026-10-13):** the 24-point viewer checklist (`viewer.mjs`) uses development-only test hooks, so it ran on the **development server**, not the production build. A command-line bug also made the run labelled "mobile" a desktop run. It has now been re-run correctly on the development server: **24/24 desktop and 24/24 mobile**. On the production build, the viewer was verified with `viewer_prod.mjs` (full 360° rotation, all four quadrants, scroll position restored, desktop and mobile) and the reduced-motion and no-WebGL checks.


## 7. Remaining limitations

- **Very fast scrubbing:** in the photoreal chapters, if decoding can't keep up, the exact live 3D model is shown for those moments instead of a stale or blank frame, by design. It is visually close but not Cycles-rendered.
- **Machine-dependent timing:** all timing figures are headless Chrome on this Mac. Real devices differ. Low-end phones will drop frames sooner, but the design degrades gracefully: fewer bitmaps, DPR caps, and live-model fallback.
- **Phones:** the opening is composed at 0.8 scale so the 1600 px phone frames are never upscaled.
- **Open-sequence crop:** the top crop in the open-sequence views is a property of the rendered frames, now always aligned to the screen top.
- **Recordings:** these use Chrome's screencast and are resampled to a constant frame rate, so a capture hitch can repeat a frame that real playback would not.

## 8. Deliverables

- **Screenshots:** `docs/screenshots/editorial/`, 12 positions × 4 layouts plus contact sheets `SHEET_*.png`, and the hero explore state.
- **Concept board:** `docs/design/concepts_A_monument_B_editorial_C_specimen.png`.
- **Recordings, 30 fps, in the project:**
  - `docs/recordings/experience_desktop_1440x900_30fps.mp4`
  - `docs/recordings/experience_phone_390x844_30fps.mp4`
- **Recordings, 60 fps:** `~/Downloads/infinos-editorial-recordings/`, too large for the ZIP.
- **Main source changes:**
  - New: `src/motion/frameLoop.ts`, `src/motion/composition.ts`, `src/motion/anchors.ts`, `src/components/story/StoryOverlay.tsx`, `src/components/product/liveLayer.ts`.
  - Rewritten: `src/components/sequence/ImageSequence.tsx`, `src/content/story.ts`.
  - Updated: `ProductCanvasInner.tsx`, `ProductScene.tsx`, `CameraController.tsx`, `cameraTrack.ts` (live keys only), `sequences.ts` (`filmLayout`), `globals.css`.
  - Removed: `StoryColumn.tsx`.
