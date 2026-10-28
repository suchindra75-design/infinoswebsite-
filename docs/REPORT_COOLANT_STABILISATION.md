# INFINOS: coolant section bug fix and performance stabilisation (final)

**Status:** complete for the packaged build.
- **Production build ID:** `AaSb3naSbe3nGHsuyiG-6`; coolant scene chunk `123.3faad3c1b9a4d4af.js`.
- **Identity check:** before packaging, the source on disk was byte-compared with the measured build: `src/`, `public/models`, `public/images`, `package.json`, `next.config.mjs` and `tsconfig.json` are identical.
- **Measurements:** every "final" figure below was taken on this exact build.

**Unchanged:** the 4-second intro and logo, the bag model and its scroll animation, the eight chapters, the 360° viewer, the navigation, the other sections, the content and the typography.

## 1. Causes of the bugs and freezes (measured)

| # | Symptom | Cause | Evidence (previous build) |
|---|---|---|---|
| 1 | Empty coolant section, then late pop-in and a freeze | R3F creates a canvas's scene only after measuring its container, and that measurement is debounced on scroll. The coolant canvas mounts mid-scroll, so its scene never started while scrolling continued; everything initialised at once when the visitor paused. | Continuous scroll: the coolant canvas drew **0 of 720** frames in its own section; the model was requested only after scrolling stopped |
| 2 | Stutter through the coolant section | The hidden bag scene kept re-rendering every frame under the coolant backdrop | **180 bag draw calls per frame** throughout the coolant section |
| 3 | Freezes while moving the mouse over the packs | Pointer hit-testing against ~30k triangles per pack on every pointer move | 4× CPU: p95 **83 ms**; 204–215 frames over 34 ms; long frames attributed to `pointermove` |
| 4 | Selection and hover jank | Every hover or selection re-rendered the whole 3D canvas, including drei's `Environment` cube camera | 4× CPU: 84–90 selection frames over 20 ms |
| 5 | Extra per-frame layout work | Section progress read with `getBoundingClientRect()` every frame | 1–2 layout reads per frame |
| 6 | Seams at the hand-off | A different background gradient; an empty dark moment; the first pack crossing the chapter 08 text | `SHEET_transition_before_desktop.png` |
| 7 | **Fading story buttons not clickable** (found in this final pass) | R3F gives its container an inline `pointer-events: auto`. Once the coolant canvas became visible (s ≥ 0), it captured clicks over the still-visible chapter 08 buttons. | At s = 0.05 the "Explore in 360°" button was 89% visible but a click at its centre hit the canvas |

**Checked, and not a cause:**
- **Lenis, GSAP and ScrollTrigger:** no conflict (one ScrollTrigger, Lenis on native scroll; the coolant section uses its own scroll maths).
- **Duplicate canvases:** none.
- **Shader compile:** 0 stalls over 4 ms in every Chrome run.
- **Memory growth:** none (section 5).
- **Console:** no errors or warnings.

## 2. Modified files

| File | Change |
|---|---|
| `src/components/coolants/CoolantCanvas.tsx` | Immediate container measurement (cause 1). Box hit-proxies for picking (3). Memoised canvas and lighting with stable props (4). Container inherits pointer events (7). The framing check includes the visible part of each entry. Lighter camera-fit search (pixel-identical result). |
| `src/components/coolants/CoolantShowcase.tsx` | Idle mount ~1.2 s after the intro, with a near-section fallback (1). Cover state decided on every scroll event (2). Cached geometry (5). The packs become clickable only once the story has fully dissolved (7). |
| `src/components/coolants/coolantStore.ts` | Cached section geometry; no per-frame layout reads (5). |
| `src/motion/stageCover.ts` (new) | The "covered" flag: the fixed bag stage and story overlay are hidden and not rendered while fully covered (2). |
| `src/components/product/liveLayer.ts` | One-line gate: no bag render while covered (2). The only change to bag code. |
| `src/motion/coolantMotion.ts` | Hand-off timing: the story dissolves over s 0–0.24 and Organic arrives from s 0.14 (6). |
| `src/app/globals.css` | The coolant backdrop equals the bag stage background; the `stage-covered` rule; a softer light pool (6). |
| `docs/REPORT_COOLANT_STABILISATION.md`, `docs/REPORT_COOLANT_REDESIGN.md` (correction note), `docs/screenshots/coolants-stabilisation/` | Documentation |

## 3. How the measurements were taken

| Kind | What it is |
|---|---|
| **Measured** | Google Chrome (the installed app, headless, Metal GPU) on this MacBook, driven through the DevTools protocol. A continuous wheel scroll from the top of the page through the story, the coolant section and into the next section. Then a mouse sweep over the packs and 12 selection changes. It records draw calls per canvas per frame, frame intervals, long animation frames (≥ 50 ms) with script attribution, layout reads, shader stalls and heap. |
| **Simulated** | "4× CPU" uses Chrome's CPU throttling, standing in for a weaker laptop or phone CPU; the GPU is not throttled. "Phone" is Chrome device emulation at 390×844 at 3× (layout, DPR, touch), running on this Mac's CPU and GPU. Neither is a real device. |
| **Measured, WebKit** | The system WebKit framework (the engine of the installed Safari 27, macOS 26.7.1), driven by a small local harness (`WKWebView`). Not the Safari app itself; see section 6. |
| **Pairing** | Each before/after pair ran back to back under the same machine state. Runs throttled by the battery (Chrome's energy saver at ≤ 20% battery caps pages at 30 fps) were discarded and re-run. |

Frame budget: 16.7 ms (60 Hz).
- **">20 ms"** means at least one missed frame.
- **">34 ms"** means at least two.

## 4. Before and after (previous build vs the final build)

### Normal CPU, desktop 1440×900 at 2× (measured)

| | Previous | Final |
|---|---|---|
| Coolant frames drawn while scrolling through its section | **0 / 720** | **721 / 721** |
| Bag draw calls per frame in the coolant section | **180** (on every frame) | 19 average (76 crossfade frames only; 0 once covered) |
| Bag rendering after the coolant section, during hover and selection | 318 / 470 / 189 frames | **0 / 0 / 0** |
| Layout reads per frame in the section | 1–2 | 0 |
| Frames over 20 ms, coolant section and after | 0 / 1 | 0 / 0 |
| Long animation frames ≥ 50 ms, whole journey | 4 | 1 (pre-existing, at s = −11.6, also present before) |
| Model request during a continuous scroll | only after scrolling stopped (32.9 s) | 7.0 s after load (idle, ~1.2 s after the intro) |

### 4× slower CPU, desktop (simulated)

| | Previous | Final |
|---|---|---|
| Coolant section, frames over 20 ms | **263 / 456 (58%)** | **47 / 671 (7%)**, all during the crossfade |
| Next section, frames over 20 ms; worst frame | 99 / 346; 133 ms | **0 / 469**; 17 ms |
| Mouse over the packs: p95; frames over 34 ms | **83.3 ms; 210** | **16.7 ms; 0** |
| Selection changes, frames over 20 ms | 84 / 124 | **0 / 193** |
| Long animation frames ≥ 50 ms, whole journey | **197** | **10** |

### Phone emulation 390×844 at 3×, normal CPU (simulated device, measured run)

| | Previous | Final |
|---|---|---|
| Coolant frames drawn while scrolling through its section | **0 / 761** | **760 / 760** |
| Bag draw calls per frame in the coolant section | 180 | 19 average (81 crossfade frames) |
| Frames over 34 ms, whole journey | 1 | 0 |
| Long animation frames ≥ 50 ms | 0 | 0 |

### Worst case: scrolling the moment the intro ends

Visitor scrolls immediately, at 1440×900.

| | Previous, normal CPU | Final, normal CPU | Previous, 4× CPU | Final, 4× CPU |
|---|---|---|---|---|
| Coolant frames drawn in its section | 0 / 720 | 721 / 721 | 0 / 458 | 660 / 660 |
| Coolant section, frames over 20 ms | 0 | 0 | **294 / 458** | **49 / 660** |
| Mouse over the packs: p95 | 16.8 ms | 16.7 ms | **83.3 ms** | **16.7 ms** |
| Selection, frames over 20 ms | 0 | 0 | 90 / 107 | 0 / 197 |
| Long animation frames ≥ 50 ms | 2 | 1 | **215** | **9** |
| One-time coolant set-up, as long frames | — | none ≥ 50 ms in this run (an earlier attribution run measured 49–51 ms) | — | **119 ms + 82 ms**, at s ≈ −12.6 |

### Do the remaining set-up frames affect scrolling?

**No. They are first-time set-up only.**

- **When:** the coolant scene is built once per page load, ~1.2 s after the intro, near the very top of the story (s ≈ −12.6).
- **Cost on Chrome:**
  - normal CPU: ≤ ~50 ms, at most about three missed frames, and not visible at all if the visitor isn't scrolling at that moment;
  - 4× CPU: 119 ms (mounting) plus 82 ms (shader pre-compile).
- **Afterwards:** it never recurs during that visit. No long frames are attributed to the coolant code in the coolant section, the next section, hover, selection or the five down/up passes. Before the fix, this cost (plus model loading) landed at the hand-off itself.
- **On WebKit** (section 6): no set-up frame over 100 ms once the GPU shader cache was warm. A first-ever run on this Mac showed one 389 ms frame at phone size.

### The bag story under 4× CPU (outside the coolant section)

Run-to-run variation here is large. Frames over 34 ms out of ~2,850 per 4× run:

| Build | Runs | Frames over 34 ms |
|---|---|---|
| Previous | 5 | 20, 25, 30, 40, 73 |
| Fixed code | 7 | 25, 29, 37, 61, 71, **77**, **103** |

**77** and **103** were measured on the exact final build. The other five came from the two builds just before it; they differ only in click handling and the camera-fit search, and their story-time code is identical.

The long frames in both builds are attributed to the bag's own frame-loop rendering (`r@…js`, unchanged code). The final build's median is somewhat higher. That might be a small effect of the second WebGL context existing from early in the story, but I couldn't separate it from noise with this many runs.

At normal CPU the story is unchanged: 1–2 frames over 34 ms in both builds.

## 5. Final regression checks (exact build, Chrome)

| Check | Result |
|---|---|
| Blank or black frames | None in continuous-scroll screenshots: desktop, tablet landscape, tablet portrait, phone (`SHEET_transition_after_*.png`) |
| Duplicated canvases | 3 constantly (4 with the viewer open), across five visits and five down/up passes |
| Hidden 3D scene rendering | The bag renders 0 frames once covered (journey draw counts above) |
| Stuck animations | Reverse scrolling is pixel-identical to forward at the same position; selection always settles |
| Repeated visits (5 reloads, each with a continuous pass and selections) | JS heap after GC: 22.5, 22.5, 22.5, 22.5, 22.3 MB; 3 canvases; no console errors |
| Clickability (centre hit-test at s = −0.5 … 3.6) | Nav links, 360° button, brand and phone menu: always clickable. Chapter 08 buttons: clickable while visible (89%, 32%, 2% at s = 0.05, 0.15, 0.22). Selector: clickable whenever visible (s ≥ 0.6). Next section: clickable. Desktop and phone. |
| 3D picks (real input) | Each pack selects; empty space deselects; 24 rapid switches settle on the last pick; desktop and phone |
| Keyboard and hover | Enter, Space and Tab; pack and button hover in sync; the selected button shows its coolant colour |
| Nav "Product" from inside the fan | Bag uncovered and visible at the top |
| 360° viewer, normally and from the coolant section | Full rotation, all quadrants, scroll restored (4680 / 4937 px); returns to the fan |
| Intro (desktop, phone, tablet) | Loader until 1.995–2.000 s; logo 2.011–3.982 s; product at 4.027–4.031 s; 0 overlap frames |
| Chapter fit on 5 layouts; section heights | Identical to all previous reports |
| Reduced motion / no WebGL (site, coolant section, viewer) | Pass |
| Console | No errors or warnings in any run |

## 6. Browser validation

| Browser | Tested how | Result |
|---|---|---|
| **Chrome** (installed app) | Headless, all of the above | Pass |
| **Safari engine (WebKit), desktop 1440×900** | System WebKit framework via a local `WKWebView` harness; real mouse clicks through the window | Continuous forward and reverse scroll: the coolant scene drew **81 / 81** frames; the bag rendered only during the crossfade (7 frames); the bag was uncovered after reverse scrolling. Button selection, 24 rapid switches, real-click picks on all three packs, clickability identical to Chrome, nav jump, 360° viewer from the section, 5 passes: all pass. No console errors. |
| **Safari engine, phone size 390×844** with an iPhone Safari user agent | Same harness | Same results as desktop: 81 / 81 coolant frames, all checks pass, no console errors. Three reloaded visits: intro finished at 5.34–5.38 s. |
| **Safari engine, WebGL disabled** | Same harness | Bag fallback and coolant still image shown; selector works; no errors |

**WebKit observations (measured; read with the limits below):**
- **Frame rate:** with macOS Low Power Mode on, WebKit ran pages at 30 Hz, so its frame times are a functional check, not a 60 Hz benchmark.
- **First-ever run on this machine** (cold GPU shader cache):
  - desktop: one 662 ms frame in the story, which did not recur;
  - phone size: a **6.35 s stall during the intro's product reveal** and one 389 ms frame after the coolant set-up.
  - With the cache warm, the reveal stall is 0.61–0.65 s on every visit at 4.74 s, and the coolant set-up shows no frame over 100 ms.
- **Reveal stall:** it comes from the bag model's start-up at the reveal (existing code, not changed here). It happens while scrolling is still locked by the intro, so it cannot cause scroll jank, but on Safari it can briefly hold the reveal. **Recommended follow-up:** profile it in real Safari on a real iPhone.
- **Memory (WebKit web-content process; includes the image-frame cache):**
  - desktop: 158 → 255 MB after the first journey, then +11 MB over five passes;
  - phone size, across three visits: 255 → 276 → 288 → 294 MB, levelling off.
  - JS heap isn't exposed in WebKit; Chrome's heap was flat (section 5).

## 7. Known limitations and tests not performed

- **Safari app:** not automated. That needs `safaridriver --enable` (an admin password) and a Safari setting change, which were not made. The WebKit tests use the same engine framework, not the Safari application or its UI.
- **Mobile Safari:** not tested. The phone WebKit run is desktop WebKit with an iPhone user agent at 390×844: no touch input, and no iOS GPU, memory or thermal limits.
- **Real devices:** none tested. "4× CPU" and "phone" in Chrome are simulations on this Mac.
- **Firefox:** not tested. The cached Playwright browsers here don't match the installed Playwright version, and nothing was downloaded.
- **Reduced motion in WebKit:** not tested; tested in Chrome.
- **High-refresh displays:** this Mac runs at 60 Hz, so 120 Hz ProMotion was not tested.
- **Bag reveal stall in WebKit:** the 0.6 s stall described above is pre-existing and outside this task's scope.
- **Battery throttling:** Chrome's energy saver caps pages at 30 fps at ≤ 20% battery. Runs affected by it were discarded and repeated; the two final pick-test runs happened under the cap and are reported as functional results only.

## 8. Screenshots (`docs/screenshots/coolants-stabilisation/`)

| Sheet | Shows |
|---|---|
| `SHEET_transition_before_desktop.png` | The previous build during a continuous scroll |
| `SHEET_transition_after_desktop/tabletL/tabletP/phone.png` | The final build during a continuous scroll (from story to next section) |
| `SHEET_final_layouts.png` | The settled fan on 5 layouts |
| `SHEET_final_selection_desktop.png`, `SHEET_final_selection_phone.png` | Selection states |
| `SHEET_edge_cases.png` | Nav jump from the fan; 360° viewer opened from the section; returning to chapter 08 |
| `SHEET_fallbacks.png` | Reduced motion and no-WebGL |
| `SHEET_webkit_desktop_forward.png`, `SHEET_webkit_mobile_forward.png`, `SHEET_webkit_selection_viewer.png` | Safari-engine (WebKit) captures |
| Folders `after/`, `before/`, `continuous/`, `regression/`, `webkit/` | Individual frames |
