# INFINOS: coolant showcase, creative redesign

> **Correction (2026-10-14):** the performance results below were measured with tests that jump to a scroll position and wait, so they missed two serious problems in a real, continuous scroll:
> - The coolant scene did not start until the visitor stopped scrolling (an R3F measurement debounced on scroll), which left the section empty and then caused a freeze.
> - The hidden bag scene kept rendering underneath.
>
> Mouse movement over the packs was also expensive and was never tested. All three are diagnosed, measured and fixed in `REPORT_COOLANT_STABILISATION.md`.

**Brief:** "Complete Creative Redesign of the Coolant Showcase Animation" (owner, 2026-10-13).

**Supersedes** the presentation in `REPORT_COOLANT_FAN.md`; the fan concept, colour mapping, model and labels are kept.

**Unchanged:** the intro, loader, logo, bag reveal and model, the eight chapters, MOVE layout, scroll story, 360° viewer, typography and content.

Screenshots are in `docs/screenshots/coolants-redesign/`:
- `SHEET_before_after_desktop.png`, `SHEET_before_after_responsive.png`
- `SHEET_after_entry_desktop.png`, `SHEET_after_selection_desktop.png`, `SHEET_after_layouts.png`
- individual frames in `before/` and `after/`

## 1. What was wrong with the previous version (found on the running site)

| Problem | Cause |
|---|---|
| **The fan formed low on the screen** | The packs started entering about half a screen *before* the stage pinned, while the whole stage was still sliding up from the bottom. At s = −0.2 the first pack sat in the lower 40% of the viewport, cut by the stage edge, with the bag still showing above it. |
| **Dark slabs over the labels** | Packs rose from below the fan as near-black silhouettes (they "lit up" late), crossing the selector. |
| **A hard hand-off** | A dark block scrolled up over the bag (with a gradient edge). It read as a new section arriving, not as a transition. |
| **Framing ignored the interface** | Fixed screen-fraction margins, not the space actually left by the nav and the selector. It fitted bounding boxes, not the real pack outlines. On phone landscape the fan shrank badly. |
| **Not dominant enough** | The fan filled about 60% of the height. The 18° lens flattened depth, and the backdrop was a uniform gradient with no light shaping. |
| **Unclear arrival** | Each pack rose square to the camera and rotated late; nothing said "placed". |
| **Late zoom** | The camera kept easing in after the packs had landed. |

## 2. Creative direction

**Approaches considered:**
- **A. A pinned studio that dissolves in over the finished bag story; packs laid into the fan one by one, from their own side, lowering onto the table.**
- **B.** The same studio; the packs land as a closed deck, then the fan opens. A strong beat, but the blue pack disappears under the others before the reveal.
- **C.** Keep the slide-over but start later. That fixes the height but keeps the weak hand-off.

**Chosen: A.** Every pack stays visible throughout, it follows the sequence in the brief (Organic → Inorganic → Eutectic), and the dissolve makes the hand-off from the bag deliberate rather than a scroll artefact.

## 3. Camera and composition

**Stage:**
- The section now overlaps the last screen of the bag story (`margin-top: −100vh`), so its full-screen stage is already pinned the moment the story completes (the story's ScrollTrigger ends "bottom bottom").
- Everything happens inside that pinned frame, so the fan can never sit low or be cut by a moving edge.
- Until then the section is fully transparent and lets clicks through. Verified: the chapter 08 "Explore in 360°" button stays clickable.

**Framing from the real geometry:**
- The camera fits the *projected outline of the actual packs* (about 750 surface points per pack, in their fan poses).
- It fits them into the *free area* measured from the live layout: below the nav, and above the selector (or beside it on phone landscape).
- The fan is centred there; it sits at about 47–50% of the screen height on desktop.
- It then checks that every pulled-forward pose stays on screen, pulling back slightly if one would not.

**Hero angle and lens:**
- About 57° elevation on desktop and tablet landscape, 66–69° on portrait screens.
- A 22–26° lens (was 18°) for natural depth.

**Fan:**
- Organic +24° (left, back), Inorganic in the middle, Eutectic −24° (right, front).
- A wider sideways spread, so each lower pack shows its cap, notch, dimples and part of its window.
- A 2° turn of the whole fan balances the front card's visual weight.
- The layers keep their real thickness, levelled for the camera angle so the fan reads flat and even.

**Size:** measured on the 1440×900 screenshots, the fan grew from 826×562 px (centre at y = 453) to 936×606 px (centre at y = 439): about 13% larger and higher. It fills 70% of the free width and up to 86% of the free height. The selection slide was shortened so the resting fan could be larger while every pulled-forward pose still fits.

**Light:**
- An overhead softbox gives long soft reflections on the frosted faces.
- A key from the upper left casts the soft contact shadows.
- A new rim light from behind draws the far edges and caps against the dark.
- A soft *pool of light* on the backdrop is centred on the fan, from the framing.
- The materials are slightly glossier, with clearer highlights.

## 4. Animation

All scroll-driven, so scrolling back reverses it exactly (verified pixel-identical forward and backward).

| s (screens into the pinned stage) | What happens |
|---|---|
| 0.00 – 0.26 | The studio backdrop dissolves in over the completed bag story. The story is gone before any pack appears. |
| 0.12 – 0.90 | The pool of light opens behind where the fan will be. |
| 0.05 – 1.55 | The camera settles from a slightly higher, slightly wider view into the hero angle (about 6% distance; no late zoom). |
| 0.26 – 0.92 | **Organic** (blue) is laid in from the left. |
| 0.58 – 1.24 | **Inorganic** (white) is laid in from just beyond its place. |
| 0.90 – 1.56 | **Eutectic** (beige) is laid in from the right, completing the fan. |
| 1.45 – 1.90 | The light settles: full key, crisper contact shadows. |
| to 2.40 | The fan holds; then the next section scrolls in. |

Each pack:
- dissolves in cleanly (its own depth pre-pass means only its front surface blends, so no recesses or cap show through);
- glides in from its side, decelerating (quartic ease-out), and turns into its fan angle;
- lowers onto the table last, so its shadow gathers beneath it as it lands.

There is no bounce, spin or zoom, and nothing travels through the top of the frame.

## 5. Selection

- The chosen pack keeps its angle, slides slightly out along its own length (0.12 pack widths), lifts just above the other two toward the viewer, and grows 6%.
- It gets a soft edge highlight in its own colour and a 7% light lift.
- The other two hold their fan positions, receding slightly.
- Switching is a continuous 0.5 s ease. Card-over-card layering follows each pack's height, so a rising pack never visibly passes through another.
- It works with mouse, touch and keyboard. Hover is synced between packs and buttons. Colours are consistent everywhere: Organic blue, Inorganic white, Eutectic very light beige.

## 6. Responsive art direction

Each layout has its own fan, camera and fill; none is a scaled-down copy.

| Layout | Direction |
|---|---|
| Desktop (≥ 1.5:1) | 24° fan, 57° camera, 22° lens; the fan fills 70% of the free width and up to 86% of the free height |
| Tablet landscape | Same fan and camera; it fills up to 74% / 84% |
| Tablet portrait | Tighter fan (20.6°), camera 66°, 24° lens; width-led |
| Phone portrait | Tighter fan (19.5°, less spread), camera 69°, 26° lens: the packs show more of their faces and grow to the width; still a fan, never a tower |
| Phone landscape | The selector moves to a column at the right (CSS); the fan uses about 92% of the free height (it was tiny before) |

Also checked at 1920×1080, 1440×780 and 1280×720.

## 7. Files

| File | Change |
|---|---|
| `src/motion/coolantMotion.ts` | New timeline (studio dissolve, light pool, camera settle, laid-in entries, light settle), per-layout art direction, fan turn, entry path |
| `src/components/coolants/CoolantCanvas.tsx` | Framing from projected pack outlines in the measured free area; entry motion; per-pack depth pre-pass for the dissolve; lighting rig with rim light; settle; shaders compiled asynchronously before the section is reached |
| `src/components/coolants/CoolantShowcase.tsx` | Backdrop and light-pool layers; the stage's DOM layers follow the scroll timeline from the shared frame loop; click-through until active |
| `src/app/globals.css` | `.cx` now overlaps the story's last screen and is transparent until active; backdrop and pool styles; phone-landscape selector column |
| `public/images/coolants-fan.webp` | Regenerated still for browsers without WebGL |
| `docs/REPORT_COOLANT_REDESIGN.md`, `docs/screenshots/coolants-redesign/` | This report and screenshots |

Not modified: `src/content/coolants.ts` (colours and names), the GLB and its generator, and every file outside the coolant section.

## 8. Verification (production build)

| Check | Result |
|---|---|
| Build, TypeScript, ESLint | Compiles; clean; 0 errors |
| Five layouts plus three desktop sizes | The fan is centred and dominant; all three packs visible and unclipped at rest and with each pack selected; no console errors |
| Picks | Desktop clicks and phone taps on each pack select it (on phone, Eutectic was tapped from the resting fan; once another pack is pulled forward it covers part of its neighbours, as intended); empty space restores the fan |
| Rapid switching | 24 selections mixed with scrolling settle on the last choice; the selection persists after scrolling out and back |
| Keyboard and hover | Enter, Space and Tab work; hover syncs between pack and button; the selected button shows its coolant colour |
| Transition | The story's chapter 08 buttons stay clickable under the transparent section; s = 0.75 is pixel-identical forward and after scrolling back |
| Reduced motion | No travel, no camera move; packs fade in place; instant selection |
| No WebGL | Still of the fan shown; selector works |
| Regression: 8 chapters on 5 layouts | Fit figures identical to before |
| Regression: supporting sections | Heights identical |
| Regression: 360° viewer (desktop and mobile) | Full rotation; scroll restored to the same positions as before (4680 / 4937 px) |
| Regression: resilience (reduced motion, no WebGL) | Pass |
| Regression: intro (desktop, phone) | Loader until 2.00 s; logo 2.02–3.98 s; product at 4.02–4.03 s; 0 overlap |
| Scroll performance, bag story (desktop @2x, 61 s, now including the coolant canvas starting up) | 1 frame over 34 ms out of 3,675; 0 long tasks |
| Scroll performance through the whole coolant section | Desktop (two runs) and phone: no slow frames during the showcase. The single slow frame per run is at s ≈ 3.0, after the stage has left, where the next section loads. 0 long tasks. |

Two problems were found and fixed during this check.

**Test tooling:** stopped perf runs had left headless Chrome instances running (up to 16 at once), which inflated load. They were cleared, and the driver now shuts its browser down if its script is stopped. One earlier desktop run showed a 1.08 s stall at s ≈ 2.0 while the machine was loaded (Spotlight indexing as well); two clean repeats did not reproduce it.

**Shader compile:** The first pack initially compiled its shaders on the frame it appeared (a 183–250 ms stall). The shaders are now compiled asynchronously well before the section, with one hidden warm-up frame for the shadow pass.

## 9. Remaining limitations

- **No playing-card photo:** it never arrived. The fan follows the written description; the angles and spread are single values per layout if you want it matched to the photo.
- **The dissolve:** packs are translucent for roughly the first third of their entry; this is deliberate. Scroll speed sets the pace, so very fast scrolling compresses the sequence.
- **Longer section:** it is 2.4 pinned screens (was 1.8), to give each pack room.
- **Phone portrait:** the width sets the size, so there is calm space above and below the fan by design.
- **Model estimates:** the thickness and back face are still estimates, because the PDF has no side view (model unchanged).
- **Testing:** headless Chrome on this Mac only; real iOS and Android devices were not tested.
