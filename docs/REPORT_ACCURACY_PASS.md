# INFINOS: final content and accuracy pass

**Source:** "INFINOS Website — Final Content and Accuracy Pass" (owner, 2026-10-13). It now sits with "Final Product Content" as the primary source in `src/content/platform.ts`.

**Scope:** content, labels, descriptions and claims only. Unchanged:
- design, typography, the 4 s intro, logo animation and product reveal;
- scroll storytelling, chapter ranges, MOVE layout and 360° viewer;
- the v0.3 GLB and all rendered frames.

## Modified files

| File | What changed |
|---|---|
| `src/content/platform.ts` | Zones, cooling wording, features, figures, product family, range cards, impact copy |
| `src/content/story.ts` | Chapter copy for 01, 02, 03 (name and body), 04, 05, 06 and 07 |
| `src/components/story/Figures.tsx` | Monitoring panel shows zone ranges only (live-style traces removed); sensor legend marked illustrative |
| `src/components/sections/PlatformSections.tsx` | Technology, Range, Applications and Impact copy; Sensorial illustration loses its sensor dot |
| `src/app/globals.css` | Monitoring-panel row: right-aligned range column replaces the sparkline; unused `.fx-spark` styles removed |
| `docs/REPORT_ACCURACY_PASS.md` (new) | This report |
| `docs/REPORT_FINAL_CONTENT.md` | Status note pointing here |
| `docs/screenshots/accuracy-pass/` (new) | Screenshots |

Not touched: intro (`IntroSequence.tsx`, `intro.css`), motion (`chapters.ts`, `composition.ts`, `frameLoop.ts`), image sequences, 3D scene and viewer. `products.ts` and `hotspots.ts` already labelled Zone 1 as the upper chamber.

## Corrections

| Confirmed information | Before | Now |
|---|---|---|
| **PCM-based thermal management** | "PCM-based cooling approach"; chapter 03 named "Precision cooling & PCM" | "PCM-based thermal management": chapter 01, chapter 03 (renamed "PCM thermal management"), pillar II, Technology lede and row 02, Pro card. "Precision" removed. |
| **Zone 1 = upper chamber** | Mostly upper already, but not stated in every description | Stated in chapter 02, chapter 04, the zone feature, the Pro card, the figure legends and the monitoring panel |
| **Data logging → Flexible Container only** | On the Sensorial card ("with data logging", "Sensing with data logging") | Flexible card point; chapter 05 note and Technology row 04: "Data logging is part of the Smart Diagnostics Flexible Container." Not attributed to the Pro bag or the Sensorial container anywhere. |
| **One product family** | "variants of smart diagnostic transportation containers" | Range lede: one family, the same underlying bag design and the same team; the flexible form factor is the basis for the other variants. Flexible card: "Product variant · the base form factor", shown first. Pro and Sensorial: "built on the flexible form factor". |
| **Sensorial capabilities not established** | "A compact smart container with sensing and data logging" | "A further variant within the INFINOS family, built on the flexible form factor." Single point: "Specific capabilities to be announced". Sensor dot removed from its illustration. |
| **Simultaneous dual-zone operation not confirmed** | "Planned · pending testing"; the monitoring panel drew two live-style temperature traces | "Not yet confirmed and awaits validation" (chapter 02), "Simultaneous operation · awaiting validation" (Technology). The traces are gone: the panel lists each zone's range only. |
| **Sensors, tamper and chain of custody without unconfirmed detail** | "customisable", "configured to the requirement", "fitted … to suit each requirement", "follow each compartment", "condition sensing", "sensors feed the app, which carries chain of custody", "handover records in the app", "received with the custody record", "In transit · monitored", "vary by variant", "Every handover, on record." | Each is named as a capability with no mechanism: "INFINOS combines sensors and a monitoring application, with chain-of-custody functionality for sample handovers." Chapter 05 headline is now "Every handover, accounted for." Chapter 04 sensor points are labelled "indicative only". |
| **35% = contamination, not validated** | Stored as "less sample degradation" (unpublished) | Stored as `FIGURES.contamination` ("lower contamination rates"), still `publish: false`. Not on the site. |
| **UV unconfirmed** | Not on the site | Still not on the site (confirmed by the text sweep) |
| **~500 t is a projection at scale** | Labelled "Projected at scale"; copy around it in present tense ("cutting the plastic…", "Fewer disposable cold packs…", "without single-use waste") | Label "projected plastic waste avoided per year" with the tag *Projected at scale*. Footnote: "a projection at scale…, not an achieved result". Surrounding copy is worded as aims ("designed to replace…", "Aims to reduce…", "with less single-use waste"). |
| **No cooling-duration or accuracy claims** | Already removed | Unchanged: "Cooling-duration figures will be published once testing is complete." `FIGURES.cooling` stays unpublished. |

## Verification (production build)

| Check | Result |
|---|---|
| Build, types, lint | `next build` compiles; `tsc` clean; ESLint 0 errors |
| Unsupported-claims sweep | Every rendered text node dumped (story, overlays, viewer markers, sections, meta). No precision, accuracy, real-time, alert, duration, UV, 35%, customisable or simultaneous-operation claims. Data logging appears only with the Flexible Container. |
| 8 chapters fit: desktop 1440×900, tablet landscape 1180×820, tablet portrait 820×1180, phone 390×844, phone landscape 844×390 | All fit; no overlaps; no console errors |
| Supporting sections, desktop and phone | Render; no console errors |
| 360° viewer (`viewer_prod.mjs`) | Full rotation, all 4 quadrants, scroll restored (desktop and mobile) |
| Reduced motion / no WebGL | Viewer opens with 12 controls / fallback image and viewer message |
| Intro, desktop · phone · tablet | Loader until 1.997–1.999 s; logo 2.013–3.984 s; product from 4.029–4.032 s; 0 overlap frames |
| Intro stalls | One loader stall of ≈260 ms near 0.85 s (desktop, tablet), within the cold-start behaviour documented in `REPORT_CINEMATIC_INTRO.md`. Phone: no stall over 40 ms. |
| Scroll performance, desktop @2x, 61 s | Two runs at load ≈5: median 16.7 ms, p95 16.8 ms, 1 frame over 34 ms out of ≈3,670, 0 long tasks |

An earlier run at load ≈12, while the machine was busy, showed 5 slow frames and 3 long tasks. The repeat runs at lower load did not reproduce them.

## Claims that still need evidence

These items are omitted from the site, labelled, or worded generally until confirmed.

1. **Up to 35% lower contamination:** test evidence. Not published.
2. **Cooling duration** (deck: "6+ h", volume-dependent): test results. Not published.
3. **Zone 1 ≈ 2–8 °C:** shown as a design concept. Holding that range needs test data before any performance claim.
4. **Zone 2 −10 °C:** shown only as an example. The actual range is unconfirmed.
5. **Simultaneous dual-zone operation:** awaiting validation.
6. **Zone 2 = lower chamber:** inferred from Zone 1 being the upper chamber. Please confirm.
7. **~500 t/yr plastic avoided:** a projection. Its assumptions are not documented on the site.
8. **450 ml pre-filled organic/chemical PCM bottle, "reusable":** from the deck. Confirm which variants it applies to, and the reuse basis.
9. **Sensors:** type, number, placement and what they measure. The illustrated sensor points are indicative.
10. **Monitoring application:** features and connectivity. The panel is labelled *Illustrative interface*.
11. **Tamper-related functionality:** the mechanism.
12. **Chain-of-custody functionality:** how handovers are recorded.
13. **Data logging (Flexible Container):** what is logged and how it is accessed. Also, whether the Pro bag or Sensorial container log data.
14. **Sensorial Smart Container:** its capabilities ("to be announced").
15. **UV sanitisation:** omitted. The title-slide photo shows a "UV ON" indicator on the prototype.
16. **Vaccines and pharmaceuticals:** stated as "designed to support". Their temperature requirements are not validated.
