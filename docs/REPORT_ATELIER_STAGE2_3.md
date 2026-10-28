# Atelier with First Light: Stages 2 and 3, and final checks

Status: all three stages are implemented. The final validation (performance fixes, gated performance comparison, full
regression on the packaged build) is in `docs/REPORT_ATELIER_FINAL_VALIDATION.md`, which supersedes the checks below.

Stage 1 (shadow checkpoint, First Light, hero) is reported in `docs/REPORT_ATELIER_STAGE1.md`. Images and recordings for
these stages are in `docs/design/atelier-stage2/` and `docs/design/atelier-stage3/`. All of them come from the production
build in headless Chrome, at desktop 1440×900 and phone 390×844 @2×.

## Stage 2: the eight chapters

One room throughout. The cove, the floor light pool and the wall wash follow the real camera through every chapter: from
the low hero, through the close passes, the top-down interior, the eye-level display and the far overview. Only the
daylight's intensity and warmth drift (`src/motion/studioLight.ts`):

| Chapters | Light |
| --- | --- |
| 01 | morning, cool neutral stone |
| 02–05 | the day climbs while the bag opens |
| 06 (top-down) | a broader pool: the floor is the backdrop |
| 07 | late light, slightly lower |
| 08 | warm, even light for the complete system |

The warmth is a faint warm neutral over the whole room. There is no coloured light; red stays on the product.

### Fixed during Stage 2 (found by reviewing every chapter on desktop and phone)

1. **Copy over a passing bag.** During the chapter 02 camera pass (0.29) and the chapter 08 pull-back (0.86), the bag
   travels behind the copy, where graphite ink over the black bag would lose contrast. The stone scrim now holds across the
   whole text column. Over the bare set it is all but invisible (the window light falls from that side anyway), and it
   washes the bag out behind the copy. Worst-case body contrast rose from 5.2–5.4:1 to 7.0:1
   (`copy-over-product-fix.jpg`).
2. **Zone colours.** The zone brackets (chapter 02) and the compartment figure (chapter 04) used literal light blues. They
   now go through the `--zone1` / `--zone2` tokens: deeper blues on the lit studio, unchanged light blues where the same
   figures appear in the dark technology section.
3. **Exploded-view 3D labels (phones)** are now graphite chips, like the story callouts. They cross the product as often
   as the stone.
4. **Hotspots.** The white markers gain a fine graphite ring, so the one beside the bag stays visible on stone. The
   explore card reads in graphite ink (`hotspot-card.jpg`).
5. **The chapter index and the drag hint** sit low on the set, where a photoreal shadow can fall. A stone halo keeps them
   legible there and is invisible on bare floor.

### Readability (final build)

Body-text contrast in every chapter (graphite `#353c42` against the background behind each chapter's text column):

| | Desktop | Phone |
| --- | --- | --- |
| Median | 8.0–8.3:1 | 8.0–8.3:1 |
| Worst case (darkest fifth of the column, bag behind the copy) | ≥ 7.0:1 | ≥ 7.6:1 |

Headlines (`#111417`) are about 14:1.

## Stage 3: into the coolant showcase, and on

- **The hand-over.** The coolant section's backdrop is now a static copy of the atelier exactly as the story leaves it:
  the same layers, late warmth and window light, with the cove where the final camera puts it (measured on resize,
  `--studio-cove-end`). So the bag, its labels and the copy dissolve, and the room does not.
  - Measured: background regions away from the bag match within 1–1.5 grey levels.
  - The text side differs by about 10 levels: that is the text scrim, which dissolves together with the copy.
- **The coolant family in the same room.** Its light pool is daylight, its UI is graphite ink, and the selected coolant
  is a graphite pill. Every swatch has a fine ring, so the white coolant's swatch doesn't vanish. The packs' own soft
  shadows read on the stone, and the no-WebGL still images are transparent, so they sit on it naturally too
  (`coolant-information.jpg`).
- **The next section.** The stone room hands over to the ivory "Smart cold-chain technology" section: close tones, one
  identity (`coolant-handover-*.jpg`).
- **Navigation.** After First Light the navigation is ivory glass with graphite ink everywhere, including over the
  graphite sections lower on the page. This is deliberate (one identity), but worth a look.
- **The 360° viewer** is unchanged, as you asked: still the dark modal studio. Its contact shadow has the same root cause
  as the story's had: `ContactShadows` at y = +0.001 in `ViewerCanvas.tsx`, so its blur passes clear the shadow. The
  one-line fix (y = −0.005) is not applied, because the viewer was out of scope.

## Checks at the end of stage 3 (build `rXK_FhaFHQGYVBTCElVXs`, superseded by the final validation)

- **Static checks.**
  - TypeScript: pass.
  - ESLint: 0 errors, 2 pre-existing warnings (`CoolantCanvas.tsx`, `Nav.tsx`, both untouched).
  - Production build: pass.
- **Regression suite.** These match the baseline (commit `1e34765`, the site before the atelier):
  - **Intro:** at 3 sizes, product first visible at 4.025–4.033 s, with zero overlap between loader, logo and product.
  - **React commits:** identical to the baseline.
  - **Memory:** repeated visits give heap 22.9–23.2 MB, against 22.6–22.9 MB on the baseline, with no growth.
  - **Coolant:** stages at 6 sizes, picks, keys, flow and cover all pass, as do reduced motion and no-WebGL.
  - **Clickability:** desktop and phone pass.
  - **Chapter text fit:** passes at 5 sizes.
  - **Viewer:** 4/4 quadrants on desktop and mobile.
  - **Resilience:** reduced motion and no-WebGL pass.
  - **Other checks:** sections at 3 sizes, gallery at 7 sizes, partner-logo marquee and social links pass. Legal name:
    0 failed. Launch check: exit 0.
- **Coolant headline fit.** 1280×720 shows the pre-existing 2 px kicker-under-nav overlap; every other size fits.
- **WebKit harness** (the WebKit engine driven by the project's harness; not the Safari app, not real devices):
  - full journey, desktop and mobile: no console errors;
  - no-WebGL: fallbacks and coolant selection work;
  - sections: 0 failed;
  - links: all clickable.
- **Performance:** measured in the final validation, after two performance fixes (`docs/REPORT_ATELIER_FINAL_VALIDATION.md`).

## Remaining limitations

1. **The 0.31 hand-over** (chapter 02 → opening frames): the frames' forward shadow is a narrower wedge than the live
   one, so the shadow tightens slightly during that cross-fade (about 230 px of scroll).
2. **A faint corner rectangle** (3–4 grey levels) in the continued shadow of the first opening-sequence frames.
3. **The two Cycles sequences** were rendered with different shadows. The live shadow is matched to each, but the reveal
   and the opening can't share one physical shadow without re-rendering, and Blender is not installed.
4. **The text-side scrim** lightens the stone on the copy's side by about 10 grey levels. It reads as window-side light,
   but it is a design choice made for readability.
5. **The navigation** is ivory glass over the graphite sections too.
6. **The 360° viewer** keeps its dark studio and its unfixed contact shadow (out of scope by instruction).
7. **Recordings.** Only First Light is real-time. The scroll recordings are frame-by-frame captures (positions, not
   playback speed). Desktop recordings are WebP because the system H.264 encoder hung on this machine.
8. **Not tested:** the Safari app and real devices.
9. **`.claude/launch.json`** gained two server entries during the work: `infinos-prod` and the temporary
   `infinos-devcopy`.

## Files changed

- **New:**
  - `src/components/product/StudioEnvironment.tsx`
  - `src/app/studio.css`
  - `src/motion/studioLight.ts`
  - `src/components/sequence/filmEdges.ts`
  - `src/content/sequenceEdges.json`
  - `tools/sequence_edges.py`
- **Edited:**
  - `src/app/layout.tsx` (stylesheet import)
  - `src/app/globals.css` (stage unlit colour, coolant backdrop)
  - `src/components/product/ProductStage.tsx` (mounts the environment)
  - `src/components/product/ProductCanvasInner.tsx` (contact-shadow fix, shadow catcher, variance shadow maps)
  - `src/components/product/LightingSystem.tsx` (shadow-only light)
  - `src/components/product/ProductModel.tsx` (meshes cast shadows)
  - `src/components/sequence/ImageSequence.tsx` (edge extension, whole-pixel frame rectangle)
  - `src/components/story/StoryOverlay.tsx` and `src/components/story/Figures.tsx` (zone colours through tokens)
- **Unchanged:** the intro, product geometry and materials, camera path, story copy, exploded view, coolant content, 360°
  viewer, gallery, navigation content.
