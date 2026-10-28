# INFINOS: coolant showcase, final fan arrangement

> **Superseded (2026-10-13):** the presentation is replaced by `REPORT_COOLANT_REDESIGN.md`: a crossfade studio stage, art-directed framing, a new entry animation and per-layout direction. The colours, model and labels are unchanged.

**Brief:** "Coolant Showcase: Final 3D Modelling and Fan Arrangement" (owner, 2026-10-13).

**Supersedes** the vertical stack in `REPORT_COOLANT_SHOWCASE.md`.

**Unchanged:** the intro, loader, logo, bag reveal and model, the eight chapters, MOVE layout, typography, content and 360° viewer.

> **Reference note:** the brief mentions a playing-card fan photograph, but only the text arrived with it. The fan follows the brief's written description exactly: three packs lying flat, all faces visible, overlapping, each at a different angle, spreading from a shared point at the bottom, left leaning left, middle between, right/front leaning right. If you send the photo, the angles and spacing can be matched to it; they are single numbers in `src/motion/coolantMotion.ts`.

Screenshots: `docs/screenshots/coolants-fan/web/` (sheets: `SHEET_*.png`).

## 1. Colour mapping (fixed everywhere)

| Coolant | Colour | Model | Selector swatch, hover and selected states, edge highlight |
|---|---|---|---|
| **Organic** | Blue / turquoise (the blue pack in coolents.pdf) | `#5ebfc6`, paler headspace above the fill line | `#6cc8ce` |
| **Inorganic** | White, softly frosted (the white pack in coolents.pdf) | `#eceee9` | `#eef0ec` |
| **Eutectic** | Very light beige, faint brown tint | `#e9e0d0` | `#e6d8c2` |

All of these come from one source, `src/content/coolants.ts`:
- the materials;
- the button swatches;
- the hover and selected button borders and tints (via the CSS variable `--cx-c`);
- the 3D edge highlight.

The previous version had Organic and Inorganic reversed; this is corrected.

## 2. 3D geometry

**No geometry changes.** The existing photo-based model (`public/models/coolant-pack.glb`, from `tools/build_coolant_pack.py`) already reproduces the visible features of coolents.pdf:
- outline and proportions (1.84 : 1), rounded corners;
- top shoulders and notch, the cap;
- recessed window, four dimples with their fine grooves;
- fill line with the paler headspace, frosted finish.

It is real geometry with thickness and rounded edges (30.5k triangles, 148 KB), shared by all three packs. As before:
- thickness, edge radius and recess depths are estimates (the PDF has no side view);
- the unphotographed back face is plain;
- nothing else was invented.

## 3. The fan

**Arrangement** (`fanPose` in `src/motion/coolantMotion.ts`):
- All three packs lie flat, front faces up, cap ends outward.
- They are rotated about a shared pivot below their lower ends: **Organic leans left (+20.6°), Inorganic sits in the middle (0°), Eutectic leans right (−20.6°)**.
- There is a small extra sideways spread, so the left edge, cap and part of the window and dimples of each lower pack stay visible.
- They are layered back to front like a hand of cards: Organic at the back, Eutectic on top.

**Realistic overlap:**
- The packs keep their real thickness. Each sits one layer (pack thickness plus a hairline) above the one below, with soft key-light shadows falling onto the pack beneath and the floor.
- Because the camera looks down at an angle, each layer's height would also push it up the screen and tip the fan. Each layer is moved toward the viewer by exactly that amount, so the fan reads level and balanced.
- Card-over-card occlusion is exact: packs are drawn in order of their current height.

**Composition:**
- Viewed from above at about 52–54°, with a long lens (18°) so the three packs read at similar sizes.
- The framing is computed for each viewport so the whole fan, including a pack pulled forward, is centred and never clipped.
- Narrow portrait screens use a slightly tighter fan (17.8°) so the packs stay larger. It is still clearly a fan, never a tower.

**Labels:** only ORGANIC, INORGANIC, EUTECTIC on the selector. The earlier "Coolants" label has been removed. There are no information panels.

## 4. Entry animation (scroll-driven, after the bag animation)

1. The bag story ends. The coolant section rises with a soft dark leading edge and pins on the same dark studio backdrop.
2. The camera eases in from a higher, wider view to the final framing.
3. **Organic** (blue) is dealt in first, then **Inorganic** (white), then **Eutectic** (beige). Each pack:
   - rises from lower on the screen, square to the camera;
   - moves into its place while turning gently to its fan angle;
   - settles with ease-out, with no bounce or spin;
   - becomes opaque while still dark, then receives the studio light as it arrives, so no see-through artefacts show.
4. The finished fan holds for about a screen of scrolling. Scrolling back reverses everything exactly.

## 5. Selection

Mouse click, touch tap, or keyboard (selector buttons; Tab, Enter and Space). The selected pack:
- keeps its fan angle;
- slides slightly out along its own axis, like a card drawn from a hand;
- lifts just above the other two, toward the viewer;
- grows 5%;
- gains a soft edge highlight in its own colour.

The other two stay in their fan positions, receding slightly. Selecting another pack returns the first and brings the new one forward, continuously (about 0.5 s). Selecting the same pack again, or clicking empty space, restores the fan.

With a mouse, hovering a pack highlights it and its button, and hovering a button highlights its pack. The selected button takes the coolant's colour. Rapid changes always settle on the last choice.

**Reduced motion:** no travel or camera move. Packs appear in place as you scroll, and selection is instant.

**No WebGL:** a still of the fan (`public/images/coolants-fan.webp`) is shown, and the selector still works.

## 6. Files

| File | Change |
|---|---|
| `src/content/coolants.ts` | Colour mapping corrected; `ui` colour for the selector states |
| `src/motion/coolantMotion.ts` | Fan geometry, entry path, selection pose, camera move-in, per-layout camera (replaces the stack) |
| `src/components/coolants/CoolantCanvas.tsx` | Fan scene: pose blending, height-ordered layering, camera move-in, colour-tinted highlight, lighting for the top-down view |
| `src/components/coolants/CoolantShowcase.tsx` | "Coolants" label removed; buttons carry their coolant colour; hover synced between buttons and packs; still renamed |
| `src/app/globals.css` | `.cx` styles: coloured hover and selected states; kicker styles removed |
| `public/images/coolants-fan.webp` | New still for browsers without WebGL (replaces `coolants-stack.webp`) |
| `docs/REPORT_COOLANT_FAN.md`, `docs/screenshots/coolants-fan/` | This report and screenshots |

Not modified: the GLB, the generator, and every file outside the coolant section.

## 7. Verification (production build)

| Check | Result |
|---|---|
| Build, TypeScript, ESLint | Compiles; clean; 0 errors |
| Fan on desktop 1440×900, tablet landscape 1180×820, tablet portrait 820×1180, phone 390×844, phone landscape 844×390 | Fan on every viewport; all three packs visible and centred; nothing clipped, including each pack selected; no console errors |
| Direct picks: desktop clicks / phone taps on each pack | Organic, Inorganic and Eutectic each select; empty space returns the fan; tapping a selected pack returns it |
| Rapid switching (24 selections mixed with scrolling) | Always settles on the last choice; selection persists after scrolling out and back |
| Transition smoothness | 16.7 ms frames (p95 16.8 ms) during selection changes; no pack seen passing through another |
| Hover and keyboard | Pack hover highlights its button and vice versa; Enter, Space and Tab work; the selected button shows its coolant colour |
| Reduced motion | Packs in place, no travel; instant selection |
| No WebGL | Fan still shown; selector works |
| Regression: 8 chapters on 5 layouts | Fit figures identical to before |
| Regression: supporting sections | Heights identical |
| Regression: 360° viewer (desktop and mobile) | Full rotation; scroll restored to the same positions (4680 / 4937 px) |
| Regression: resilience (reduced motion, no WebGL) | Pass |
| Regression: intro (desktop, phone) | Loader until 2.00 s; logo 2.02–3.98 s; product at 4.03 s; 0 overlap |
| Scroll performance, narrative (desktop @2x, 61 s) | 1 frame over 34 ms out of 3,663; 0 long tasks (same as before) |
| Scroll performance through the coolant section, including canvas start-up | Desktop 0 out of 1,302; phone 0 out of 1,805; 0 long tasks |

**Tooling note:** the Mac restarted when the battery ran out mid-session, which cleared the temporary QA folder. The test scripts were restored from the session record. Browser automation was replaced by a small local DevTools-protocol driver using Node's built-in WebSocket, so nothing new was downloaded.
