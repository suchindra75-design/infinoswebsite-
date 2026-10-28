# INFINOS Tech — Website Architecture

Status: **Hybrid 3D experience.** The product is a photo-validated parametric replica (no CAD yet —
see `docs/MODEL_VALIDATION.md`), shown both as photoreal Cycles image sequences and as an interactive GLB.
All technical values remain marked illustrative/placeholder. Nothing invented is presented as fact.

---

## 1. Information Architecture

The 10-part narrative is distributed across **one cinematic landing experience + light supporting
pages**, not ten separate pages.

| Narrative beat | Where it lives | Form |
|---|---|---|
| — Product story | Scroll | Editorial stage + single frame loop: see REPORT_EDITORIAL_REDESIGN.md (supersedes the MOVE split layout) |
| 01 — Intro / Brand | Page load, 0–4 s (before scrolling) | Cinematic intro: courier loader → INFINOS logo formation → dive → product (see REPORT_CINEMATIC_INTRO.md) |
| 02 — The Problem | Landing, scroll chapter 1 | Narrative caption over product reveal |
| 03 — The INFINOS System | Landing, scroll chapter 2 | Product hero (name + one-line system statement) |
| 04 — The Product | Landing, scroll chapter 3 | **Exploded view** (signature interaction) |
| 05 — How It Works | Landing, scroll chapter 4 | Thermal story (cooling / heating on the assembled product) |
| 06 — Intelligent Telemetry | Landing, scroll chapter 5 | Physical display → digital telemetry bridge |
| 07 — Applications | Landing, scroll chapter 6 + DOM section | Transition caption + interactive "one platform" section |
| 08 — Technology / Engineering | `/technology` (Phase 3) | Supporting page — engineering deep-dive |
| 09 — Company | `/company` (Phase 3; stub section now) | Supporting page |
| 10 — Contact | `/contact` (Phase 3; stub section now) | Supporting page |

Later: product-detail pages are generated from the product data model (`/products/[slug]`),
so future INFINOS products reuse the same architecture.

## 2. Site Map

```
/                    Landing (scroll narrative + applications + company/contact stubs)
/technology          Phase 3 — engineering / technology page
/products            Phase 3 — product index (data-model driven)
/products/[slug]     Phase 3 — product detail (real GLB + real specs)
/company             Phase 3 — company page
/contact             Phase 3 — contact page
```

Navigation (kept minimal): **INFINOS** · Technology · Products · Applications · Company · Contact.
`Technology` and `Products` currently scroll to the narrative; they become real routes in Phase 3.

## 3. Component Architecture

```
src/
├── app/                        # Next.js App Router (routing, metadata, fonts, icon)
│   └── dev/model-review/       # development-only model QA view (404 in production)
├── content/
│   ├── site.ts                 # nav, brand, chapter captions, contact
│   ├── products.ts             # product data model + MODEL_COMPONENTS (generated layer table)
│   ├── sequences.json          # camera paths, opening stages, film format — shared with the Blender renderer
│   └── hotspots.ts             # explore markers (anchors on the model, photo-based descriptions)
├── state/experienceStore.ts    # central experience state (zustand)
├── motion/
│   ├── chapters.ts             # chapter timing + progress → phase / stages / exploded / sequence cover
│   ├── sequences.ts            # spline camera paths, stage windows, frame index, film layout (TS twin of the renderer)
│   ├── pose.ts                 # rigid layer pose from stages + explode (shared by every 3D view)
│   ├── cameraTrack.ts          # the continuous scroll camera track (all chapters)
│   ├── ScrollChapterController.tsx
│   └── SmoothScrollProvider.tsx
└── components/
    ├── sequence/ImageSequence.tsx   # photoreal frame layer (canvas 2D, progressive + priority loading)
    ├── viewer/                      # dedicated 360° viewer (ProductViewer overlay, ViewerCanvas)
    ├── product/                     # live 3D layer + DOM overlays
    │   ├── ProductStage.tsx         # fixed stage: drag rotation, hotspot card, HUDs
    │   ├── ProductScene.tsx         # stacks the live canvas and the sequence layer, cross-fades them
    │   ├── ProductCanvasInner.tsx   # R3F canvas (transparent, Neutral tone mapping, paused while covered)
    │   ├── ProductModel.tsx         # GLB loader, per-layer wrappers, labels, hotspots
    │   ├── ExplodedViewController.tsx, CameraController.tsx, LightingSystem.tsx, renderSettings.ts
    │   ├── Hotspots.tsx, ThermalVisualization.tsx, TelemetryVisualization.tsx, ComponentLabels.tsx
    │   └── PlaceholderProduct.tsx, ProductFallback.tsx
    ├── sections/ navigation/ hero/ ui/
tools/
├── build_infinos_bag.py        # parametric Blender generator (model + AO bake + component table)
├── optimize_glb.mjs            # simplify + meshopt for the web
├── render_sequences.py         # Cycles frames from the same generator, paths and stages
└── encode_sequences.py         # transparent WebP, desktop + mobile
```

## 4. Hybrid Scene Architecture

Two layers sit on one fixed stage over a shared CSS studio backdrop, framed by the **same 16:10 film rectangle**
(`filmLayout`): landscape screens cover-fit it, portrait screens fit it by width with a zoom.

```
.stage (CSS backdrop)
├── .stage-live   R3F canvas (transparent): LightingSystem · RotationRig(ProductRoot, ExplodedViewController)
│                 · ContactShadows · CameraController (setViewOffset = film rectangle)
└── .sequence-canvas   photoreal frame for the current scroll position (transparent WebP, same rectangle)
```

In sequence chapters the live camera follows the sequence path exactly and the live pose follows the same opening
stages, so the photoreal layer can fade in/out over the live model at any scroll speed. While a sequence fully covers
the stage, the live canvas switches to `frameloop="demand"`. If the frames are absent the live layer plays the path.

## 5. Product State Machine

```
INTRO → REVEAL▣ → HERO (interactive) → DETAIL ×3 → OPEN▣ → EXPLODED → THERMAL → TELEMETRY → APPLICATIONS
▣ = photoreal image sequence over the live scene
```

| State | Camera | Product | DOM |
|---|---|---|---|
| intro | first frame of the reveal path | closed | logo overlay |
| reveal ▣ | Cycles orbit/dolly (72 frames) | closed | problem caption |
| hero | end of the reveal path | closed; drag to rotate, hotspots turn features to camera | system caption, hotspot card |
| detail | three close-ups (flap, display + emblem, front emblem) | closed | product caption |
| open ▣ | pull-back from the emblem → look into the box (120 frames) | flap → lid → drop panel → inner box out → box lid | construction caption |
| exploded | front, elevated | layers separate from the open pose | layer labels |
| thermal | looking into the opened inner box | reassembled (still open), liner glows cool/warm | thermal HUD |
| telemetry | close-up on the display | bag closes (stages reversed) | telemetry HUD |
| applications | wide | closed | transition caption |

## 6. Scroll / Animation Architecture

```
intro 0.00–0.04 · reveal▣ 0.04–0.17 · hero 0.17–0.28 · detail 0.28–0.40 · open▣ 0.40–0.56
exploded 0.56–0.68 · thermal 0.68–0.78 · telemetry 0.78–0.89 · applications 0.89–1.00
```

**One continuous timeline.** Everything visible is a pure function of the scroll progress from the single
ScrollTrigger in `ScrollChapterController` (Lenis smooths the scroll itself):

- **Camera** — `src/motion/cameraTrack.ts`: one track over the whole narrative. Sequence chapters use the exact paths
  the Cycles frames were rendered with; each live chapter's first key equals the previous chapter's last pose and its
  last key equals the next chapter's first pose. Same Catmull-Rom + sine-ease maths everywhere, so position, target
  and fov are continuous (measured ≤ 1e-8 at every boundary) and nothing is time-based: no GSAP camera tweens, no
  blends, no resets — scrolling up retraces exactly the same frames.
- **Components** — `chapters.ts` → opening stages + explode amount → `pose.ts`, applied exactly every frame by
  `ExplodedViewController` (no easing lag, so the live model stays frame-locked to the photoreal sequences).
- **Interactive yaw / parallax** — weighted by `heroInteractionWeight`, which is zero at both hero boundaries, so the
  hand-offs to the reveal frames and the detail path are exact in both directions.
- **Layers** — `ImageSequence` writes the frame canvas and the live layer opacities in the same rAF (they always sum
  to a fully covered stage); a frame only covers the live model when it is within 4 frames of the exact one (the
  loader fetches frames around the scroll position first); the live canvas resumes rendering from 85 % into a
  sequence chapter so its first visible frame is already current.
- **Exposure match** — per-sequence `displayGain` (CSS brightness on the frame canvas, files untouched) + the live
  exposure in `renderSettings.ts`, calibrated by measurement at the hand-overs.

**360° viewer** — `src/components/viewer/`: a modal with its own canvas and a clone of the same GLB (OrbitControls,
unbounded azimuth). Opening pauses Lenis and the narrative canvas; closing restores the exact scroll position, chapter
state and focus.

## 7. Responsive Strategy

| Tier | Behavior |
|---|---|
| Desktop | cinematic camera, full exploded distances, all layer labels, pointer parallax in hero |
| Tablet | same composition, simplified parallax, dpr clamped |
| Mobile | reduced exploded distances (×0.55), fewer labels, same camera story, touch-friendly nav, no horizontal overflow, no tiny technical text |

Mobile gets the same narrative with a reduced composition — not the desktop scene scaled down.

## 8. Asset Requirements

- **Primary:** real INFINOS product GLB/GLTF (CAD-derived, decimated for web; pivot at base
  center; Y-up; real-world scale; one draw call per physical layer where possible so the exploded
  view maps to `components[]`).
- Placeholder geometry in `PlaceholderProduct.tsx` is driven by `content/products.ts`
  `components[]` (id, label, explode direction/distance/rotation, base position) — the real model
  replaces the geometry, not the architecture.
- Naming convention: `/public/models/<product-slug>.glb` + optional KTX2 textures.
- Brand: `logo.jpg` (existing INFINOS logo, reused from the INFINOS dashboard for ecosystem
  consistency).
- See `public/models/README.md`.

## 9. Content Requirements

All copy and specifications live in `content/`. Every unknown is flagged `placeholder: true` and
rendered as `[PLACEHOLDER]` / "illustrative". Never invented: certifications, medical approvals,
exact temperature ranges, battery specs, sensor accuracy, IP ratings, materials, performance
claims. The keys defined: `PRODUCT_NAME, PRODUCT_DESCRIPTION, THERMAL_RANGE,
COOLING_CAPABILITY, HEATING_CAPABILITY, SENSOR_TYPES, DISPLAY_INFORMATION,
TELEMETRY_CAPABILITIES, APPLICATIONS`.

## 10. Performance Strategy

- Model: 65.7k triangles, 4.25 MB (meshopt + quantisation), lazy-loaded once scrolling starts; the reveal sequence
  covers its download.
- Frames: transparent WebP, ~15–40 KB each (desktop 1440×900, mobile 960×600 chosen by viewport × DPR); endpoints
  first, then progressively finer strides; the open sequence queues behind the reveal.
- The live canvas renders on demand while a sequence covers it; dpr clamped `[1, 1.75]`; no shadow maps
  (ContactShadows only); procedural environment (no HDR download); no post-processing.
- Scroll-driven updates are rAF-aligned; 3D state is read via `getState()` in `useFrame`.
- `prefers-reduced-motion`: Lenis disabled, camera transitions instant, idle drift removed.
- No-WebGL fallback: static render + the same DOM narrative (sequence frames still play).
