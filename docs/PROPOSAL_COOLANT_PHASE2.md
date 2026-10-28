# INFINOS coolant showcase, Phase 2: audit and proposal

**Step 1 of 2.** Nothing has been changed.

**Baseline:** `infinos-website-coolants-stabilised.zip`. The working project was byte-compared with it: `src/` and the configs are identical. The project is not a Git repository. Step 2 starts by creating a Git checkpoint of this baseline, and the ZIP stays as the untouched reference.

## 1. Current coolant section architecture

### Where it begins and ends

| Point | Scroll position (s = screens into the section) | What happens |
|---|---|---|
| Section top | s = −1 | `#coolants` (`.cx`) starts one screen early (`margin-top: −100vh`). It overlaps the last screen of the bag story and is fully transparent, letting clicks through. |
| Bag story completes | **s = 0** | The narrative ScrollTrigger ends ("bottom bottom"). The coolant stage (`.cx-stage`, sticky, 100vh) is already pinned. |
| Hand-off | 0 – 0.24 | The studio backdrop (identical to the bag stage's background) covers the bag, its labels and the chapter 08 text. From 0.25 the bag stage is hidden and not rendered (`stageCover`). |
| Packs dealt | 0.14 – 1.46 | Organic 0.14–0.82, Inorganic 0.46–1.14, Eutectic 0.78–1.46, with the camera settling and the light pool gathering. |
| Fan holds | ~1.5 – 2.4 | The settled fan; the selector is visible (it fades in from s ≈ 0.32 and is clickable from s ≈ 0.47). |
| Stage leaves | 2.4 – 3.4 | The sticky stage scrolls away; the Positioning section (`#platform`) follows. |

The section is placed in `src/components/Experience.tsx`, right after the narrative spacer and before `<main className="site-content">`.

### Components and data flow

| File | Role |
|---|---|
| `src/content/coolants.ts` | The only content: `id`, `name`, colours (`liquid`, `headspace`, `ui`). No information fields yet. |
| `src/motion/coolantMotion.ts` | The timeline: pure functions of s (`entryAt`, `backdropAt`, `cameraAt`, `settleAt`, `pickerAt`, `COVER_FROM`, `PINNED_SPAN = 2.4`). Also per-layout art direction (`direction(w, h)`: desktop, tablet landscape, tablet portrait, phone, phone landscape) and the poses (`fanPose`, `entryStart`, `selectedPose`). |
| `src/components/coolants/coolantStore.ts` | A zustand store `{ selected, hovered, select, toggle, hover }`. Non-React runtime state: visibility, dirty and animating flags, and cached section geometry (`measureSection`, `sectionScroll` without layout reads). |
| `src/components/coolants/CoolantShowcase.tsx` | The section DOM: backdrop, light pool, canvas host and selector. Idle mount ~1.2 s after the intro. Cover state on every scroll. A DOM updater on the shared frame loop (order 39) writes opacity and data attributes from s, with no React re-render while scrolling. |
| `src/components/coolants/CoolantCanvas.tsx` | **The single R3F canvas** (`frameloop="never"`), rendered by the shared frame loop (order 40) only while visible and only when something changes. It includes: <ul><li>one GLB (body and cap) shared by all three packs;</li><li>per-pack shell and cap materials with shader injections (fill line, rim highlight, dim, light);</li><li>a per-pack depth pre-pass and height-ordered draw for exact card-over-card overlap;</li><li>invisible box hit-proxies for picking;</li><li>memoised lighting;</li><li>`fitCamera`, which frames the fan from projected pack outlines inside the free area left by the nav and the selector.</li></ul> |
| `src/motion/stageCover.ts`, `src/components/product/liveLayer.ts` | Hide the bag stage and stop its rendering while it is covered. |
| `src/app/globals.css` (`.cx*`, ~160 lines) | Section, stage, backdrop, pool, selector (a row along the bottom; a column on phone landscape). |

### Selection and animation now

- **Triggers:** the buttons (mouse, touch, keyboard) and clicks on the 3D packs both call `toggle(id)`. Clicking empty space deselects. There is no Escape handling yet.
- **Animation (eased in the scene, about 0.55 s):**
  - the selected pack keeps its fan angle, slides 0.12 pack-widths along its own axis, lifts above the others and grows 6%, with a rim light in its own colour;
  - the other two dim by 16%.
- **The camera does not move** on selection.
- **Persistence:** the selection survives scrolling out and back.
- **Timing:** selection is possible from s ≈ 0.47, while packs are still being dealt.
- **Fallbacks:**
  - reduced motion: no travel and instant changes;
  - no WebGL: a still image (`coolants-fan.webp`) and a working selector, though the still image does not change with selection.

### Free space around the settled fan (measured on the final screenshots, CSS px)

| Layout | Fan | Space for information |
|---|---|---|
| Desktop 1440×900 | 57% of the width, centred | ~250–310 px at each side; ~110 px above |
| Tablet landscape 1180×820 | 62% | ~220 px at each side |
| Tablet portrait 820×1180 | 80% of the width | ~270 px above; ~280 px between the fan and the selector |
| Phone 390×844 | 78% of the width | ~230 px above; ~200 px between the fan and the selector |
| Phone landscape 844×390 | 41% of the width | ~180 px on the left; the selector column is on the right |

## 2. Recommended information layout

### Typography and principles

- **Type:** the existing editorial language only.
  - Mono uppercase kicker (as in `.ed-kicker`);
  - the large display headline style of the chapters;
  - body copy at chapter size;
  - hairline separators.
- **Never added:** cards, boxes, icons, glows or gradients.
- **Fields:** each information field is a quiet two-line row (mono label, plain value). A field appears only when it is verified in the content configuration.
- **Empty state is designed first.** With today's verified information, a selected coolant shows only its name, its colour and the family line, and must still look intentional.

### Per stage

| Stage | On screen |
|---|---|
| **A: family** (fan settled, nothing selected) | <ul><li>Top-left: the kicker `INFINOS COOLANTS` and a short family headline in the chapter style. The copy needs your approval; a claim-free option is "Three coolant variants. One pack design."</li><li>Desktop and tablet: hairline name labels anchored to each pack, the same callout style as the bag chapters. That makes it immediately clear the packs are three variants.</li><li>Phone: the selector already names them, so no labels (they would crowd the fan).</li><li>A quiet hint above the selector: "Select a coolant".</li></ul> |
| **B: focus** | <ul><li>The existing selection animation, unchanged.</li><li>The family headline is replaced by the selected name in large type, with its colour swatch.</li><li>The pack labels fade out.</li></ul> |
| **C: information** | The verified rows for that coolant appear under the name with a short staggered fade (CSS only, ~300 ms; instant with reduced motion). |
| **D: switching** | The name and rows cross-fade to the next coolant (keyed by id). The 3D scene only re-targets its existing easing; nothing is rebuilt or reloaded. The selection in the store is the single source for both the model and the text, so they can't disagree. |
| **E: return** | <ul><li>An explicit "All coolants" control at the start of the selector row.</li><li>Also: clicking the selected pack or button again, clicking empty space, or pressing **Esc**.</li><li>All of them restore the family view exactly (the existing deselect path).</li></ul> |

### Desktop and tablet landscape: one decision needed

The side margins, about 250–310 px, are narrow for information.

| Option | Description | Trade-off |
|---|---|---|
| **A: no composition change** | The name and rows sit in the left margin of the fixed fan composition, at most ~260 px wide. | The fan stays exactly as approved. Long values wrap tightly; past ~5 rows on desktop (fewer on tablet landscape) some fields fall behind a "More details" toggle. |
| **B: MOVE-style focus** (recommended) | While a coolant is selected, the whole fan glides about 18% to the left in screen space (a camera *view offset* only). The arrangement, angles, colours, proportions and lighting are untouched. The information takes a ~380 px column on the right. Returning to the family glides it back exactly. | This is the bag story's own MOVE language (product left, text right), so it feels like a continuation. It does temporarily reframe the protected composition, which is why it needs your approval. |

**Recommendation: B on desktop and tablet landscape**, if you are comfortable with the fan reframing while information is open. Otherwise A.

### Portrait and phone layouts (no composition change needed)

| Layout | Layout of the information |
|---|---|
| **Tablet portrait** | The name in the ~270 px band above the fan; rows in two columns in the ~280 px band below it. |
| **Phone portrait** | The name above the fan. Up to 3 rows in the ~200 px band between the fan and the selector. Further fields open a "Details" sheet that rises from the bottom and covers at most the area below the fan. The selected pack is never covered. |
| **Phone landscape** | The name and up to 2 rows in the ~180 px left margin. "Details" opens a left-side sheet while the fan stays at the right. |

## 3. Proposed scroll and interaction sequence

| s | Behaviour |
|---|---|
| 0 – 1.46 | Unchanged (hand-off and packs dealt). |
| ~1.5 | **Stage A** appears with the settled fan: kicker, family line, pack labels, hint. |
| 1.5 – end of hold | **Stages B–E** by interaction: select, read, switch, return. Not tied to scroll position. |
| End of hold | The stage scrolls away as now; the selection persists if the visitor comes back. |

Two small behaviour changes are proposed, for robustness:

1. **Information appears only once the fan is complete** (s ≥ ~1.46). Selection during the deal stays as it is; the panel simply waits for the fan.
2. **Scrolling back above the completed fan** (s < ~1.3) quietly returns to the family view. A selected, lifted pack therefore never mixes with the reversed dealing animation, and reverse scrolling always replays the original entry.

**Pinned length:** to give reading time without the stage scrolling away mid-read, I propose lengthening the hold by ~0.5 screens (`PINNED_SPAN` 2.4 → ~2.9). Only the section's length changes; nothing else moves.

**Alternative, not recommended:** a scroll-driven "guided tour", where scrolling past the fan steps through Organic → Inorganic → Eutectic. It's possible, but it competes with click selection (two sources of truth) and makes reverse scrolling and fast scrolling harder to keep glitch-free.

## 4. Required component changes (Step 2)

| File | Change |
|---|---|
| `src/content/coolants.ts` | Extend to a typed configuration: <ul><li>the family copy;</li><li>per coolant, an ordered list of optional fields: `type`, `composition`, `physical`, `application`, `operatingRange`, `phaseChange`, `reusability`, `storage`, `compatibility`;</li><li>each field carries `value`, `status: 'verified' | 'placeholder'` and `source`.</li></ul> Only `verified` fields render; placeholders are visible to editors and never to visitors. |
| `src/components/coolants/CoolantInfo.tsx` (new) | The family header, the selected name and the field rows. It subscribes narrowly to `selected` and renders only on selection changes. Transitions are CSS-only. It uses `aria-live="polite"` and proper headings. |
| `src/components/coolants/CoolantShowcase.tsx` | Mount `CoolantInfo` inside the stage; add the "All coolants" control and Esc. The existing frame-loop DOM updater gets one more data attribute (`data-phase`: intro / family / focus) for CSS; there are still no per-frame React renders. |
| `src/components/coolants/coolantStore.ts` | `clear()` and a guarded "return to the family" used by the reverse-scroll rule. |
| `src/motion/coolantMotion.ts` | `familyAt(s)` / info gating; `PINNED_SPAN` if approved; Option B's focus offset per layout. |
| `src/components/coolants/CoolantCanvas.tsx` | **Option A:** no change. **Option B:** one eased screen-space view offset in the existing per-frame update. `fitCamera` also computes the focus framing, so the selected pose provably stays in frame. No new geometry, lights or materials; nothing rebuilt on selection. |
| `src/app/globals.css` | `.cx-info*` per layout, using the existing typography tokens. |
| `public/images/` | For no-WebGL: three extra stills of the selected states (rendered from the real scene, ~17 KB each), so the fallback image matches the selection. Optional; your call. |

**Not touched:** the intro, the bag, the chapters, the viewer, the navigation, the other sections, the coolant model and colours, the fan poses and the existing selection animation.

## 5. Technical risks and how they'll be handled

| Risk | Mitigation |
|---|---|
| The information needs space; the fan composition is protected | The decision in section 2 (A or B). Portrait layouts need no composition change. |
| Small screens: phone landscape has ~180 px | Progressive disclosure ("Details" sheet); the selected pack is never covered. |
| Selection during the deal, or reverse scroll with information open | Information gated to the completed fan; auto-return when scrolling back (section 3). |
| Re-renders reaching the 3D canvas | The canvas is memoised; `CoolantInfo` uses narrow store selectors; checked with the React commit counter in the journey test. |
| Layout shift | The information is absolutely positioned inside the sticky stage, so the document never reflows; fonts are already loaded. |
| Clickability | The information layer is `pointer-events: none` except its own controls, and the existing centre hit-test probe covers it. |
| Performance regression | The same journey suite (normal and 4× CPU, phone, worst case, repeated visits, WebKit) is compared against the stabilised build on the "before" server. |
| Missing content makes Stage C feel empty | The empty state is designed first; it must look intentional with zero fields. |

## 6. Information I need from you

**Per coolant (Organic, Inorganic, Eutectic): which of these are verified, the exact wording, and a source:**

1. Coolant type or classification (e.g. organic PCM, inorganic salt solution, eutectic mixture).
2. Composition, and whether it may be published.
3. Physical characteristics: pack dimensions, weight, fill volume.
4. Intended application: which samples, which temperature zone (Zone 1 upper / Zone 2 lower), which use cases.
5. Operating temperature range and/or phase-change temperature.
6. Reusability (and on what basis, e.g. tested cycles).
7. Storage and conditioning (pre-conditioning temperature and time).
8. Compatibility with INFINOS containers (which variants or chambers).
9. Anything that must not be published.

**Clarifications from earlier material:**

10. The pitch deck describes an "organic **or chemical** PCM" coolant in a "pre-filled **450 ml bottle**". Is "Inorganic" what the deck calls "chemical"? Does 450 ml apply to these rigid packs, and to all three?
11. Is "PCM" accurate for all three variants?
12. coolents.pdf only shows the white and the turquoise pack. Is the Eutectic pack the same moulding?

**Decisions:**

13. Option **A** or **B** for desktop and tablet landscape (section 2).
14. The family headline copy, e.g. "Three coolant variants. One pack design." (or yours).
15. Approve the two behaviour changes (information after the fan completes; auto-return on reverse scroll) and the longer hold (+0.5 screens).
16. Should there be a call to action on the information panel (e.g. "Request specifications" → contact)?
17. Extra no-WebGL stills per selection: yes or no.

**Until fields are provided:** Step 2 can be built and fully tested with the empty state and clearly marked placeholders that are not rendered. Real values then drop into `coolants.ts` without changing any component.
