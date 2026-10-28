# INFINOS: coolant showcase, phase 1 (3D coolant models and stacking animation)

> **Superseded (2026-10-13):** the arrangement, colour mapping and labels described here are replaced by `REPORT_COOLANT_FAN.md`.
> - The packs are now fanned like playing cards.
> - Organic is blue and Inorganic is white.
> - Only the three names are shown.
> - The model described here is unchanged and still in use.

**Source:** "INFINOS Website — Phase 1: 3D Coolant Models and Stacking Animation" (owner, 2026-10-13), with `coolents.pdf` as the physical reference.

**Scope:**
- Visual only. No information panels or technical descriptions.
- Intro, bag model and frames, chapters, MOVE layout, 360° viewer, content and typography are unchanged.

## 1. The three models

| Variant | Appearance |
|---|---|
| **Organic** | White, frosted, slightly translucent-looking plastic |
| **Inorganic** | Subtle turquoise-blue |
| **Eutectic** | Very light beige (the brown tint is kept faint) |

**Real 3D models, not placeholders.** Each pack is polygon geometry generated in Blender (`tools/build_coolant_pack.py`):
- 30.5k triangles (body and cap);
- one 148 KB GLB, shared by all three variants;
- no textures; the colour comes from the material.

They are **photo-based replicas**: the front view is measured from the photographs, and the parts the PDF doesn't show are estimated (listed below).

**About the PDF:**
- It has three pages but shows only **two physical packs**. Pages 1 and 2 are the same white pack (page 1 is a screenshot of the photo with black bars); page 3 is the turquoise pack.
- Both are the same rigid, blow-moulded part, front view only.
- **There is no photograph of a eutectic (beige) pack.** That model uses the same pack with the beige colour from your brief.

### How closely the geometry follows the PDF

Proportions are in pack widths (W), measured on pages 2 and 3 and averaged. Comparisons: `docs/screenshots/coolants/model/compare_*_photo_vs_model.png`.

| Feature | Source | Model |
|---|---|---|
| Outline: height 1.84 W, rounded corners (top 0.06 W, bottom 0.045 W) | Photo (p.2 1.85, p.3 1.80) | As measured |
| Top notch: two shoulders, angled walls, opening ±0.22 W, floor ±0.166 W, depth 0.145 W, centred | Photo | As measured |
| Cap: round, Ø 0.14 W, about 0.125 W high, short narrower neck, on the notch floor, top just below the shoulders | Photo | As measured |
| Recessed rectangular window: 0.30 W wide, 0.595 W to 1.29 W below the shoulder top, rounded corners | Photo | As measured |
| Four round dimples (x = ±0.25 W, level with the window ends), each with a fine groove running out to its side edge | Photo | As measured |
| Fill line about 0.29 W below the shoulder top, with a paler headspace above it | Photo (both packs) | Drawn by the material from a level stored in the model |
| Thickness 0.28 W, edge radius 0.055 W | **Estimate**: no side view | Typical for this kind of rigid ice brick |
| Recess depths (window, dimples, grooves) | **Estimate** from shading | Shallow, as the photos suggest |
| Back face | **Not photographed** | Kept plain (slight doming); nothing invented |
| Real dimensions | Not given | Nominal scale (W = 100 mm); not shown anywhere |

No labels, handles, ports, text or other features were added.

## 2. How the stacking animation works

**Section:**
- A new section, `#coolants`, follows the main product animation.
- It pins a full-screen stage on the site's studio backdrop for about 1.8 screens of scrolling.
- A soft dark leading edge dims the narrative's last view as the section arrives.

**Entry (scroll-driven):** a pure function of the section's own scroll position (`src/motion/coolantMotion.ts`).
- The packs arrive **one after another**: organic first (bottom), then inorganic, then eutectic (top).
- Each descends gently into its place in the stack while emerging from darkness into the studio light.
- They become opaque in the first moments while still dark, so no see-through artefacts show.
- No rotation and no bounce. Scrolling back reverses the sequence exactly.

**Stack:**
- The packs lie flat, long side horizontal, cap to the right.
- Each face is tilted toward the viewer so all three stay fully visible, with an even gap between them.
- Soft key-light shadows fall from pack to pack and onto the floor.
- The procedural studio environment matches the main scene.

**Framing:** computed for each viewport. The whole stack, including a pack brought forward, always fits between the small "Coolants" label and the selector, without clipping.

**Selection (visual only):**
- Click or tap a pack, or use the selector buttons (also keyboard-accessible).
- The selected pack slides forward out of the stack, rises slightly, grows 7.5%, and gains a soft edge-light highlight.
- The other two stay in the stack and recede slightly.
- Selecting another pack moves the focus smoothly (about 0.5 s); selecting it again, or clicking empty space, returns it.
- With a mouse, hovering gives a faint highlight and a pointer cursor.

**Rendering and performance:**
- The section has its own canvas, driven by the site's single frame loop. It renders only while on screen and only when something changes.
- The canvas mounts about 1.5 screens before the section arrives, with shaders compiled in an idle moment.
- Nothing from it loads during the intro.

**Reduced motion:** no travel or easing. Packs appear in place as you scroll, and selection changes instantly.

**No WebGL or model failure:** a still image of the settled stack is shown, and the selector still works.

**On-screen text:** the only new text is the label "Coolants" and the three names on the selector buttons, which are needed to select a pack by keyboard or screen reader. Either can be removed if you prefer none.

## 3. Files

**Created**

| File | Purpose |
|---|---|
| `tools/build_coolant_pack.py` | Pack generator (measurements documented in its header) |
| `public/models/coolant-pack.glb` | The model, 148 KB |
| `public/images/coolants-stack.webp` | Still for browsers without WebGL, 16 KB |
| `src/content/coolants.ts` | Names and colour mapping only |
| `src/motion/coolantMotion.ts` | Scroll timeline, stack layout, per-layout camera |
| `src/components/coolants/CoolantShowcase.tsx` | Section, lazy mount, selector |
| `src/components/coolants/CoolantCanvas.tsx` | Scene, materials, selection animation |
| `src/components/coolants/coolantStore.ts` | Selection state |
| `docs/REPORT_COOLANT_SHOWCASE.md`, `docs/screenshots/coolants/` | This report and screenshots |

**Modified**

| File | Change |
|---|---|
| `src/components/Experience.tsx` | One import, and `<CoolantShowcase />` placed after the narrative |
| `src/app/globals.css` | New `.cx` block appended |
| `tools/optimize_glb.mjs` | Optional `--normal-bits` flag; the default is unchanged, so the bag pipeline is unaffected |
| `public/models/README.md` | Coolant model entry |

## 4. Build and test results (production build)

| Check | Result |
|---|---|
| Build, TypeScript, ESLint | Compiles; clean; 0 errors |
| Coolant layouts: desktop 1440×900, tablet landscape 1180×820, tablet portrait 820×1180, phone 390×844, phone landscape 844×390 | Whole stack visible and unclipped, including each pack selected; no console errors |
| 3D picking | Clicking or tapping the middle and top packs selects them; empty space deselects (desktop mouse and phone touch) |
| Repeated selection and scrolling | 24 rapid selections mixed with scrolling end on the last pick; the selection persists after scrolling out and back |
| Selection transition smoothness | Frames 16.7 ms (p95 16.8 ms) during transitions on desktop and phone |
| Hover | Pointer cursor and highlight appear and clear |
| Reduced motion | Packs appear in place without travel; selection is instant |
| No WebGL | Still image shown; selector works; no errors |
| Regression: 8 chapters on 5 layouts | Fit figures identical to before |
| Regression: supporting sections | Heights identical to before |
| Regression: 360° viewer (desktop and mobile) | Full rotation; scroll restored to the same positions as before (4680 / 4937 px), so the narrative is unchanged |
| Regression: reduced motion / no WebGL (site) | Pass |
| Regression: intro | Loader until 1.97–2.00 s; logo 2.01–3.99 s; product from 4.02–4.04 s; 0 overlap. No coolant file loads during the intro. |
| Scroll performance, narrative (desktop @2x, 61 s) | 1 frame over 34 ms out of 3,664; 0 long tasks (same as before) |
| Scroll performance through the coolant section, including canvas mount and compile | Desktop: 0 frames over 34 ms out of 1,715; phone: 0 out of 1,815. 0 long tasks. |

**Notes on the measurements:**
- The scroll-performance figures were measured before a final tidy-up that touched only hover and cursor handling, not the scroll path.
- A last re-run happened after the Mac switched to battery Low Power Mode. That caps Chrome at 30 fps on every page, including the untouched intro, so its timings (all 33.3 ms) are not comparable. It still showed 0 frames over 34 ms and 0 long tasks. Re-running on mains power is recommended.
- The intro's single loader stall of about 240–263 ms matches the earlier documented baseline.

## 5. Still open

1. **Thickness and back face:** a side and a back photograph would replace the estimates.
2. **Eutectic pack:** a photograph would confirm that it shares the same moulding.
3. **On-screen names:** keep or remove the "Coolants" label and the three button names?
4. **Phase 2:** coolant information panels, once you provide the content.
