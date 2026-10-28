# INFINOS — Visual concept rethink: three directions (proposal, not implemented)

Status: **awaiting approval.** Nothing in the site has been changed for these concepts. The rejected "controlled field"
atmosphere (contour rings, motes, grain field) has been removed from the working tree; the site is back to commit
`1e34765`.

Mockup boards: `docs/design/visual-concepts/` (see "Boards" below).

## How the mockups were made

Every still is the real production build (commit `1e34765`, the real model, the real photoreal frames, the real layout
and copy). Each concept was injected into the page as a temporary stylesheet plus a small layer behind the product, then
captured at the opening and in each of the eight chapters (desktop 1440×900, phone 390×844). Nothing is painted over the
product.

The environment geometry is not drawn by eye. It is computed from the site's own camera track (`cameraTrack.ts`,
`composition.ts`, `filmLayout`): where the floor meets the wall, where the floor pool lies in perspective under the bag,
and where architectural planes fall. So each mockup shows what an implementation would produce at that scroll position.

They are mockups. The light levels are tuned by eye on one display. The stills show positions inside each chapter; the
transitions between them are described in the text, not shown.

## What studying the current site showed

- **The bag floats.** The backdrop is darkest at the floor, so the bag's contact shadow has nothing to fall on. Worse, in
  the live 3D chapters (hero, exterior pass, interior, display, overview) there is no visible contact shadow at all.
  This was checked on a neutral light backdrop: the bag hangs in space in all of them. Only the photoreal frames (reveal,
  open) carry a real shadow. This is the main reason the product does not yet look photographed. It needs fixing
  whichever concept is chosen.
- **The grain layer** in the studio backdrop (`/textures/grain.png` in `--studio`) is visible as texture on large screens.
  All three concepts remove it.
- **The text.** In the current committed build the chapter text is not faded. One still landed on chapter 03 while its
  headline was still entering (it fades in at 0.352–0.370 of the story by design). Measured body-text contrast in each
  concept is listed below.
- **The product renders were lit** by a key softbox from the upper front-left (`LightingSystem`, key at −2.6, 5.2, 3.6),
  with rim strips behind. Any environment light has to agree with that direction, or the bag will look pasted in.

---

## Concept A — "The Graphite Studio" (photographic cyclorama) — RECOMMENDED

**1. Environment.** A seamless graphite infinity cove, the set a product photographer builds for one object. The floor
curves softly into the wall about 2.6 m behind the bag. There is no hard horizon, no props and no pattern. The space is
physical: the cove and the light on the floor are projected from the same camera as the bag. When the camera rises and
looks down (chapters 05–06), the wall leaves the frame and the floor becomes the whole background, exactly as in a real
studio.

**2. Materials and colours.** Matte, paper-like graphite in a warm-neutral range:

- wall about `#131516`, rising to `#24272a` at the cove;
- floor `#202325`, falling to `#0c0d0e` toward the lens;
- light warm-neutral (rgb 232 228 221), never blue, never red.

Smooth gradients only, with no grain, texture or noise. If 8-bit banding ever shows, it would be dithered below
visibility (±½ level), never as visible grain.

**3. Lighting direction.** One large overhead softbox from the front-left, the same key the renders were lit with:

- It lays a soft elliptical pool on the floor, slightly back-right of the bag, where the contact shadow falls, so the
  shadow finally reads.
- The same source washes the wall just above the cove behind the product, separating the black top edges from the
  background.
- The frame edges, and especially the text side, fall away to near-black like a lit set.

**4. Product presentation.** The bag is grounded by the floor pool and the contact shadow (to be fixed in the live
chapters) and separated by the wall wash behind its upper body. Its red is the only saturated colour in the frame, and the
black structure reads against the lit floor. Scale and composition stay exactly as they are; the composition track is
unchanged.

**5. Evolution through the scroll.** The camera moves through a real space: cove and pool hold true perspective at
every frame. Between chapters the photographer re-lights, eased across the boundaries:

| Chapters | Lighting |
| --- | --- |
| 01–02 | broad, soft key: the hero shot |
| 03–05 (the bag opens) | a tighter, slightly cooler pool: the cold interior |
| 06 (looking down) | floor only, a broad even pool, like a light table |
| 07 (display close-up) | low key, the darkest frame, so the screen and the red carry the image |
| 08 (complete system) | the widest, most even light: the full studio |

Chapter 08 then hands over to the coolant section on the same backdrop. At rest, nothing moves.

**6. Why it suits INFINOS.** It presents the bag as premium hardware is presented: a physical object in a studio, not a
graphic. For a diagnostic cold-chain product whose credibility depends on looking real and precise, that is the right
register. It adds no motif that can repeat, competes with nothing, and costs essentially nothing in readability or
performance.

Measured body-text contrast (`--muted` #a7b0b8 on the median background behind each chapter's column): **8.3–8.8:1 in
every chapter**, against 7.1–7.4:1 on the current site. Headlines (#f7f6f2) exceed 15:1.

## Concept B — "Architectural Light" (gallery interior)

**1. Environment.** A quiet architectural interior: a dark mineral back wall, a satin stone floor, and a single tall,
recessed slot of warm light in the wall, like a gallery doorway. The slot is placed per shot, as on a film set: always
on the product's side, clear of the bag and the copy. It lies reflected in the floor as a soft vertical streak.

**2. Materials and colours.**

- microcement graphite wall `#0b0c0d`–`#17181a`;
- honed stone floor with a satin sheen;
- slot in warm white `#c9c0b2`–`#e3dacd`, its reveal face lit bronze-grey;
- no blue.

**3. Lighting direction.** Two sources: the product's own key (front-left, already in the renders), and the slot as a
back/side source. The slot spills softly onto the floor and gives the floor its reflection.

**4. Product presentation.** A sculpture in a gallery. The deep space makes the red glow, the slot gives a vertical
counterpoint and depth, and a floor pool carries the contact shadow.

**5. Evolution through the scroll.** The room is in true perspective:

- as the camera orbits, the slot slides along the wall and its reflection follows;
- looking down (05–06), the wall leaves the frame and only a faint spill remains on the floor;
- at the display close-up the slot moves to the far edge;
- in the overview it stands far right, beyond the labels.

**6. Why it could suit INFINOS, and why it is not recommended.** It is architectural, permanent and calm, and it gives
the site a signature image. But the slot is the brightest thing on screen after the product, and it appears in nearly
every chapter. That makes it the repeated motif the brief warns against: the eye goes to it. A glowing vertical bar in
a dark room is also one misjudgement away from reading as a neon tube or sci-fi set. It needs more geometry per frame
(a few CSS-3D planes or a small 2D canvas) and per-shot set-dressing to keep the slot off the labels.

## Concept C — "Daylight Atelier" (high-key, one day)

**1. Environment.** A pale mineral studio of warm plaster and stone, lit by a large unseen window on the left: soft
daylight with no hard patches.

**2. Materials and colours.** Plaster `#c6c5c2`–`#dcdad5` in the morning, warming to `#d8cdbd` in the afternoon, then
dusk greys and graphite at night. Text switches to graphite ink on the light chapters.

**3. Lighting direction.** Soft window light from the left, agreeing with the renders' key, with the floor brighter
around the bag.

**4. Product presentation.** Red on stone gives the strongest colour of the three, and the black structure reads
crisply. The photoreal frames' shadows look natural on a pale floor. It reads as catalogue photography.

**5. Evolution through the scroll.** One day passes:

- morning for the first look;
- midday as the bag opens;
- warm afternoon for the interior;
- dusk for the display close-up;
- night for the complete system, which lands in the dark sections below.

"From doorstep to laboratory" becomes a day.

**6. Why it could suit INFINOS, and why it is not recommended.** It is the most distinctive and the most human, a long
way from any dark template. But:

- **It reverses the dark identity** approved in the last redesign. Every overlay component (callouts, figures, the
  monitoring panel, hotspots, navigation, buttons) needs a light variant.
- **A light floor exposes the limits of the existing renders.** The pre-rendered open-sequence shadows run to the edge of
  their film and show as a cut on a pale floor. The live model's missing shadow becomes obvious. Doing it properly would
  ideally mean re-rendering the frames, and Blender is not installed here.
- **Body-text contrast drops** to about 5.5–5.8:1 (about 3.7–4.5:1 in the warm chapters 05–06), against 7.1–7.4:1 on
  the current site and 8.3–8.8:1 in A. It would need darker text and stronger scrims.
- **The intro would need a dawn.** The dark logo animation would need a transition into daylight.

---

## Recommendation: Concept A, "The Graphite Studio"

- **It fixes the real problem.** The bag looks unphotographed because it has no ground. A addresses that directly (a lit
  floor, a visible contact shadow, separation from the wall) instead of adding something to look at.
- **Nothing competes with the product.** B adds a second bright subject to every chapter; C repaints the whole site.
- **Best readability.** The text side is the darkest, calmest field in every chapter (8.3–8.8:1 body contrast measured).
- **Consistent from every camera angle**, because the environment is derived from the camera, not drawn behind it: low
  hero, top-down interior and far overview are one physical studio.
- **Beautiful when still.** Every still is a composed studio photograph; motion only comes from the camera moving
  through a real space and the light being re-set between chapters.
- **Cheapest and safest.** A handful of composited layers moved by transform and opacity: no new canvas, no shader, no
  repaint while scrolling, no autonomous animation. Reduced motion behaves the same as full motion.

## Implementation plan for A (only after approval)

1. **Remove the grain layer from `--studio` and rebuild the backdrop.**
   - Replace `--studio` with the cyclorama base.
   - The coolant hand-over (`.cx-backdrop`) and the 360° viewer keep sharing that same definition, so hand-overs stay
     invisible.
2. **Add an environment layer inside `.stage`, behind both product layers.** It holds four absolutely positioned layers
   with fixed gradients: cove band, floor pool, wall wash and edge falloff. They are positioned only by `transform` and
   `opacity` from the shared frame loop (one renderer, before the frames), using the existing `cameraAt` /
   `compositionAt` / `filmLayout` projection. This means:
   - no repaints;
   - nothing runs at rest;
   - it is hidden while the coolant section or the viewer covers the stage.
3. **Add a lighting plan per chapter** (pool level and size, wall wash, falloff, temperature), eased with `smoothstep`
   across chapter boundaries.
4. **Fix the live contact shadow** (diagnose why the existing `ContactShadows` does not show), matching its density to
   the baked shadows at the reveal and open hand-overs.
5. **Retint the scrims** to the studio's own black, so the text column stays the calmest field.
6. **Leave everything else untouched:** intro timing and logo, model geometry and materials, camera architecture, story
   logic, exploded view, coolant showcase, 360° viewer, gallery and consent rules, content and navigation.
7. **Validate:**
   - the existing suites: intro timing, chapter fit at 5 sizes, coolant, viewer, reduced motion, no-WebGL, WebKit
     harness;
   - text contrast per chapter;
   - per-chapter stills, before and after;
   - idle frame cadence and scroll frame timing (throttle-gated);
   - no Safari or real-device claims unless those are actually tested.

## Boards

- `docs/design/visual-concepts/0-current.jpg`: the current site (reference).
- `docs/design/visual-concepts/A-graphite-studio.jpg`
- `docs/design/visual-concepts/B-architectural-light.jpg`
- `docs/design/visual-concepts/C-daylight-atelier.jpg`
- `docs/design/visual-concepts/compare-hero.jpg`: the same hero moment in all four.
- `docs/design/visual-concepts/compare-open.jpg`: the same opening moment in all four.
- `docs/design/visual-concepts/mockup-source/`: the injected stylesheets and layer scripts for each concept, the
  geometry helper (`geo2.ts`, run with Node 24 against copies of `sequences.ts`, `cameraTrack.ts` and `composition.ts`)
  and the capture script. These are mockup tools, not production code.
