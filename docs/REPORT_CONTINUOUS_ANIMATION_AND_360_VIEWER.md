# Report — continuous scroll animation + 360° viewer

Preserved unchanged: the v0.3 GLB (`public/models/t1.glb`) and all 192 rendered frames (`public/sequences/`, 72 + 120,
desktop + mobile). No model regeneration, no re-render, no rebuild from scratch.

## Root causes found

| Problem | Cause |
|---|---|
| Camera jumps, lags, resets on chapter entry, differs when scrolling up | Live chapters moved the camera with ~2 s **time-based** GSAP tweens fired on phase changes; entering a sequence chapter used a 1.1 s time blend |
| Detail chapter "cuts" | Three discrete shots switched at progress thresholds |
| Hero rotation / drift not reversible | Yaw returned to zero on a clock; idle drift on a clock |
| Live model a few frames behind the photoreal frames | Layer transforms eased with a time constant |
| Stale frame when 3D reappears after the open sequence | Live canvas paused under the frames; React took 1–2 frames to resume it (measured: 5-unit jump at 5 % opacity) |
| Brief blank frames at cross-fades | Frame canvas and live layer opacities were written in different frames (rAF vs React render) |
| Jumping ahead showed far-away / no frames | Fixed-order frame loading |
| Frames darker than live 3D | Cycles vs real-time exposure (measured 23–45 % darker) |

`ProductScrollScene.tsx` does not exist in this project; the scroll scene is `ProductStage` / `ProductScene`. There was
only one ScrollTrigger (no overlapping instances) — kept as the single driver.

## Fixes

1. **One continuous camera track** (`src/motion/cameraTrack.ts`): the camera is a pure function of scroll progress.
   Reveal/open use the exact rendered paths; every live chapter's first/last key equals its neighbours' poses; same
   spline + ease maths throughout. `CameraController` now just evaluates it (all GSAP camera tweens removed).
2. Detail chapter is a path hero → flap → side (display + emblem) → front emblem (= first open frame), with holds.
3. Hero drag yaw, pointer parallax and drift are weighted by a scroll function that is zero at both hero boundaries.
4. Layer poses applied exactly every frame (Lenis already smooths the scroll), so stages/explode are frame-locked to
   the sequences and fully reversible.
5. Both layer opacities written in one rAF; live canvas resumes from 85 % into a sequence chapter (before it is seen).
6. Frames only cover the live model when within 4 frames of the exact one; loader prioritises frames around the
   current scroll position; otherwise the (always exact) live model stays visible — no blank or wrong frames.
7. Exposure matched by measurement: per-sequence `displayGain` (CSS brightness, files untouched) + live exposure.
8. **360° VIEW** (`src/components/viewer/`): floating button on every page section (top-right under the nav on
   phones), plus nav and mobile-menu entries. Modal viewer with its own canvas and a clone of the same GLB:
   mouse/touch drag (unbounded 360°), ◀ ▶ (45°), zoom − +, RESET, AUTO-ROTATE (off by default), FULL SCREEN,
   FRONT / RIGHT / REAR / LEFT / TOP, live heading readout, keyboard (arrows, + −, R, A, F, Esc), focus trap. Opening
   pauses scrolling and the narrative canvas; closing restores scroll position, chapter state and focus. No-WebGL:
   explanatory fallback. Reduced motion: instant view moves, no damping.
9. Fixed while testing: rapid repeated viewer clicks did not accumulate; portrait screens cropped the product in the
   viewer (adaptive fov); mobile launcher overlapped the thermal/telemetry HUD.

## Tested in the browser (headless Chrome, dev + production builds)

- Timeline sampled at 4 000 scroll steps: chapter boundaries continuous to ≤ 1e-8 (position, target, fov, stages,
  explode); no spikes (max step ≈ 99th percentile); scrolling up reproduces scrolling down exactly; camera never
  enters the product.
- Real wheel scrolling through Lenis, every frame logged, down and up: 0 blank frames; live camera never faster than
  the track itself (no jumps); all 9 chapters; sequence ↔ live cross-fades aligned.
- 360° viewer, desktop (mouse) and mobile (touch): 24/24 checks — full 360° drag, ±45° buttons, 5 rapid clicks =
  225°, zoom, all five views, reset, auto-rotate default off / on / off, keyboard, full-screen enter/exit, close
  restores scroll + state + focus, page scrolls again. Production: all four heading quadrants by drag, scroll restored.
- Desktop 1280×800 and mobile 390×844 layouts; reduced-motion mode; no-WebGL fallback (site + viewer).
- Console errors and failed network requests: none (dev and production). Typecheck clean; lint 0 errors (2 old
  `<img>` warnings in untouched files).

## Remaining notes

- Inside the opened inner box, Cycles' global illumination is darker than real-time rendering can show; the open
  sequence is matched to ~0.8 of live brightness there (raising it further would blow out the red panels).
- With reduced motion, Lenis is off, so the scroll (and therefore the animation) follows raw scroll steps.

---

# Addendum — product clarity from the first frame

## Causes found
1. The stage faded in with scroll (opacity 0 → 1 over the first 6 % of scrolling), so the bag first appeared dimmed,
   under the full-screen INFINOS TECH title.
2. The reveal camera started ~8.3 units away: the bag was small (587 px tall on a retina screen vs 943 px at the end).
3. Frames were 1440 × 900 (upscaled ~1.8× on retina; the 960 × 600 mobile set ~2× on phones).
4. Reveal frames loaded progressively and nothing waited for them.

Measured on the old frames at the same display size: the first frame had 79 % of the final frame's gradient detail
and 27 % of its fine-detail (Laplacian) energy.

## Fixes
- **Re-rendered the reveal (72 frames) at 2560 × 1600** (16:10 film, above 2560 × 1440), 16 samples + OpenImageDenoise
  without aux prefilter, Blackman-Harris anti-aliasing, no depth of field, no motion blur, exposure set in the render
  (+0.55 EV) instead of a display-time lift. Mobile set 1600 × 1000. The open sequence (120 frames) is unchanged.
- **Reframed reveal path:** starts close and elevated (quilted top, display plate, biohazard and front panel readable
  at full size), keeps the bag right of the caption column, ends exactly on the unchanged hero pose (so the live
  model hand-off is identical). Same studio key / fill / rim rig as the live scene.
- **Opening:** reveal frames preload in order behind a thin progress line (no placeholder image); the product then
  emerges from the dark studio by visibility only (already full resolution, sharpness and exposure); the INFINOS TECH
  logo animation starts only after the product is fully revealed and sits in a left column (bottom on phones).
- **Frame set per screen:** chosen from the device pixels the film rectangle needs (2560 frames on retina laptops,
  1600 on phones).

## Validation (production build, 1280 × 800 at 2× = retina; bag cropped and scaled to the same display size)

| Reveal position | Bag height (px) | Fine detail (Laplacian) | Luminance |
|---|---|---|---|
| First visible frame | 907 | 98.2 | 65.4 |
| 25 % | 881 | 92.1 | 63.0 |
| 50 % | 889 | 98.0 | 59.7 |
| 75 % | 994 | 107.5 | 60.9 |
| 100 % (hand-off to live 3D) | 966 | 76.7 | 65.6 |
| *Before: old first frame* | *587* | *6.5* | *58.0* |

The first visible frame is as sharp as (finer-detailed than) the final reveal frame, equally exposed and almost the
same size. Opening timing (production, local): product visible 0.8 s after load (all 72 reveal frames preloaded),
fully revealed 2.7 s, logo animation starts 3.4 s. Mobile (390 × 844 at 3×): 1600 px frames (no upscaling), detail
constant across all positions. Exposure frame vs live at the hand-off: 1.004. Regressions re-run: timeline
continuity (boundaries ≤ 2e-9, reverse identical), real wheel scrolling (0 blank frames, no jumps), 360° viewer
24/24, reduced motion, no-WebGL, production console/network — all clean. Screenshots: `docs/clarity-validation/`.

Payload: the reveal now preloads 7.0 MB on retina desktops (3.6 MB on phones) before the product appears; the thin
progress line shows while it loads (9 s safety net once frame 0 is in).

## Completion — unpacking sequence at the same quality

- The open (unpacking) sequence is now also rendered at **2560 × 1600** (12 samples + OIDN, no DOF / motion blur,
  exposure +1.25 EV in the render), same camera path and poses — 120 frames; mobile set 1600 × 1000. Old 1440 frames
  kept in `tools/build/legacy/`.
- Hand-over exposure: path tracing lifts dark fabric more than real-time shading, so a single exposure cannot match
  both the black front close-up (start) and the box interior (end). A per-sequence gain curve
  (`displayGainKeys`, CSS brightness, files untouched) is calibrated at both hand-over zones (0.70 → native 1.0 → 0.95);
  measured frame/live ratio on the product ≈ 0.9 (start) and 0.92 (end).
- Payload: reveal 6.8 MB + open 18.1 MB on retina desktops (preloaded: reveal only; the open set streams afterwards,
  frames around the scroll position first); 3.5 + 7.5 MB on phones.
- Re-tested (production build): opening clarity table unchanged (first frame as sharp as the final one; product
  visible 0.64 s, logo after full reveal), wheel scroll down/up 0 blank frames and no jumps, 360° viewer 24/24 (dev)
  and full-quadrant drag + scroll restore (production, desktop + mobile), reduced motion, no-WebGL, no console errors
  or failed requests.
