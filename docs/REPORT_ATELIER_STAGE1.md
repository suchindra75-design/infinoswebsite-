# Atelier with First Light: Stage 1 report (shadow checkpoint, First Light, hero)

Status: Stage 1 is implemented and verified on the production build. **Paused for review before Stage 2**, as agreed.
Nothing is committed yet.

Images and recordings are in `docs/design/atelier-stage1/`. All of them come from the production build (`npm run build`
+ `next start`), in headless Chrome, at desktop 1440×900 and phone 390×844 @2×.

## 1. Shadow checkpoint

### Why the live chapters had no contact shadow

The live scene's `ContactShadows` was mounted and visible, and its depth pass rendered the bag correctly. Its two render
targets were nevertheless empty.

drei draws its blur passes on a plane at the world origin, seen through the shadow camera. That camera sits at the
component's position, looking up. The component was at **+1 mm**, so the blur plane lay just behind the camera. Every blur
pass therefore cleared the render target and drew nothing, which wiped out the depth pass.

The fix is moving it to −5 mm (`ProductCanvasInner.tsx`). This was proven by reading the render-target pixels before
and after.

### Matching the pre-rendered frames

The two Cycles sequences carry different shadows, apparently rendered with different light rigs. Blender isn't
installed, so they can't be re-rendered.

| Where | The frames show |
| --- | --- |
| Reveal (→ hero, 0.11) | A contact shadow only. |
| Opening sequence start (0.31) | A dense forward shadow from the lights behind the bag: a wedge, darkest at the base. |
| Opening sequence end (→ interior, 0.57) | A soft contact shadow only. |

So the live shadow follows its neighbours, as pure functions of scroll progress (`src/motion/studioLight.ts`):

- **Contact shadow everywhere:** opacity 0.6, deepening to 1.0 toward 0.31.
- **A forward shadow** that builds through chapter 02 and is gone again under the frames before the live interior. It is
  cast by a shadow-only light (intensity 0) behind-left of the bag, so the product's own shading is unchanged: it casts
  shadows but receives none. Only an invisible floor on its own render layer receives it. It is weighted by a material
  uniform (per-light shadow intensity only re-uploads when the light setup changes), fades with distance like an area
  light, and uses smooth variance shadow maps with no noise. The shadow map re-renders only when the pose or turn changes.

The frames' own shadow is now continued past the edge of their film (`src/components/sequence/filmEdges.ts`,
`src/content/sequenceEdges.json` from `tools/sequence_edges.py`). On a light floor it would otherwise end in hard lines,
because the film edges are on screen in almost every frame position. The frame is drawn on whole device pixels, so the
continuation meets it without a seam: the largest step across the edge measured 2 grey levels.

**Result** (`shadow-checkpoint-desktop.jpg`, `shadow-checkpoint-phone.jpg`: the same scroll position, frames alone vs live
alone):

- **0.11 and 0.57:** the live and pre-rendered shadows match closely.
- **0.31:** close in density at the base. The frames' wedge is narrower and reaches further toward the camera, so during
  the hand-over cross-fade (about 230 px of scroll) the shadow tightens slightly.
- **Known minor artifact:** in the first frames of the opening sequence, the bottom-right corner of the continued shadow
  is 3–4 grey levels off from its neighbours (a faint rectangle).

## 2. First Light and the hero

- **The intro is unchanged.** Measured on this build, the product is first visible at 4.025–4.028 s at three sizes, with
  zero overlap between loader, logo and product, as before.
- **The handover.** The stage starts unlit, with exactly the intro's own backdrop, so the bag emerges as it always has.
  After the intro ends (5.1 s), the studio lights come up:
  - the floor pool around the bag first (0.35 s delay, 1.4 s);
  - then the room and the window light (0.95 s, 1.9 s);
  - then the wash behind the bag (1.15 s, 1.8 s).

  These are CSS transitions on the compositor and run once. Overlay ink switches to graphite as the room passes mid-grey
  (1.75 s), with a short colour cross-fade.
- **Reduced motion:** the studio is lit before the intro fades, and nothing animates (verified).
- **The environment** (`StudioEnvironment.tsx`, `studio.css`) is a pale stone cyclorama with window light from the left.
  The cove, the floor light pool and the wall wash are projected from the real camera every frame, and every layer is
  only moved, scaled or faded. Its estimated GPU texture cost on a phone at 3× dropped from about 148 MB to about 45 MB
  after restructuring the layers, against today's site at the same scroll position.
- **Readability, chapter 01** (body text on the median background behind the column): **8.5:1 desktop, 8.3:1 phone**;
  headline about 14:1.

## 3. Checks run on this build

| Check | Result |
| --- | --- |
| TypeScript | Pass. |
| ESLint | 0 errors; 2 pre-existing warnings, in files not touched. |
| Production build | Pass. |
| Intro timing at 3 sizes | Unchanged. |
| Reduced motion and no-WebGL resilience | Pass; no page errors. |
| 360° viewer, desktop and mobile | 4/4 quadrants; scroll restored; no console errors. |
| Chapter text fit, desktop and phone | All chapters fit; no console errors. |

**Not run yet** (they belong to the final pass): the full regression suite, the WebKit harness and throttle-gated
performance runs. No Safari or real-device claims are made.

## 4. Not yet done (Stages 2 and 3)

- **Chapters 02–08.** The environment already follows the camera through all of them, but the per-chapter light plan,
  the figures and panels on the light ground, and the chapter index over dark shadows (seen at 0.08) still need tuning
  and verification.
- **The coolant showcase** still uses the old dark studio backdrop, so the story end jumps from light to dark (Stage 3).
- **The 360° viewer backdrop**, and the navigation over the lower sections (now ivory glass everywhere), still need
  checking for continuity (Stage 3).

## 5. Recordings

- `stage1-desktop.webp` (animated WebP). The real-time opening (screencast), then a frame-by-frame scroll from progress 0
  to 0.25 played at 30 fps. The scroll part shows positions, not real-time playback speed. The desktop H.264 encode hung
  inside the system video encoder on this machine, so this one is WebP.
- `stage1-phone.mp4`. The same, at the phone size.
