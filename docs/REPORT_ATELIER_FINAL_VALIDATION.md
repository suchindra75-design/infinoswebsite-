# Atelier with First Light: final validation

Status: validated code commit `c743dc0`, production build `UW9pHN9SJZglfJUl3dY3Z`. Everything below was measured on that
exact build:

- the gated performance comparison;
- the full regression suite;
- the visual captures;
- the focused hand-over test.

The commit that adds this report changes only documentation.

The previous code commit, `5b93a07`, had also passed a full performance comparison and regression run, and its numbers
are given as a second sample. `c743dc0` only adds the two customers to the Ecosystem section.

The baseline is commit `1e34765`, the Cinematic site before the atelier. All runs used headless Chrome on this Mac
(Intel), and the WebKit runs used the project's WKWebView harness. Neither the Safari app nor real devices were tested.

Images and recordings are in `docs/design/atelier-final/`.

## 1. Changes since the stage 2/3 report

1. **Story performance** (commit `c17d196`, plus the shadow-map change before it):
   - **Shadow map:** the forward shadow's shadow map is re-rendered only while that shadow is visible, and its floor
     compiles on the warm-up frame.
   - **Frame-edge strips:** the averaged edge strips of the photoreal frames were tiny GPU canvases. Each draw of one
     into the frame canvas cost a GPU round trip, and the frame is redrawn on every scrolled frame. They are now
     software canvases, cached per frame and edge.
   - **Result at 4× CPU slowdown:** script time over the first 60 % of the story fell from 32.0 s to 24.8 s, against
     24.5 s on the baseline. Long animation frames fell from 53 to 10, against 6 on the baseline.
   - **Pixels:** the drawn output is unchanged.
2. **Chapter index legibility** (commit `5b93a07`). The graphite chapter index and the drag hint sit where the bag (on
   phones, in the chapter 02 close-up) or a photoreal shadow (on desktop, at the end of the reveal) can pass behind
   them. There they read at about 1.5:1. A crisp 1 px stone outline under the existing halo fixes this and is
   invisible on the bare floor. Pixel changes against the previous build are confined to the index and the hint.
3. **Customers** (commit `c743dc0`, owner-confirmed 2026-10-31):
   - Yashoda Hospitals and Pranaam Hospitals lead the "Our Ecosystem" strip with the relationship "Customer".
   - Their logos are the header logos of their official websites (owner-approved download), encoded like the others:
     trimmed only, never recoloured.
   - The section's intro and note now mention customers (`ecosystem-customers-*.jpg`).

## 2. Performance

The runs were throttle-gated:

- Each run counts only if the Mac was charging and `CPU_Speed_Limit` stayed at 100 % in every 2-second sample.
- Invalid runs were discarded and repeated.
- Baseline and final runs alternated.

Each run is one continuous wheel journey: the whole story, the coolant section, the next section, then interaction
with the coolant fan.

### Story section (final build `UW9pHN9SJZglfJUl3dY3Z`)

| | Desktop 1440×900 @2 | | Desktop at 4× CPU | | Phone 390×844 @3 | |
| --- | --- | --- | --- | --- | --- | --- |
| | Baseline | Final | Baseline | Final | Baseline | Final |
| Frames | 3811 | 3993 | 2779 | 2851 | 4318 | 5431 |
| Over 20 ms | 3 | 10 | 1777 (64 %) | 1821 (64 %) | 8 | 3 |
| Over 34 ms | 1 | 5 | 296 | 305 | 7 | 2 |
| p95 frame | 16.7 ms | 16.8 ms | 50 ms | 50 ms | 16.7 ms | 16.7 ms |
| Worst frame | 917 ms | 917 ms | 483 ms | 1000 ms | 1000 ms | 917 ms |
| Long animation frames (> 50 ms) | 1 | 4 | 61 | 20 | 6 | 3 |

The Mac was busier in the background during this 4× CPU pair than in earlier sessions: both builds ran slower than
before. The CPU itself was not throttled.

### Second sample: commit `5b93a07` (build `ZGjHl-iWXO1TPIi9vyMm_`)

| | Desktop: baseline / final | 4× CPU: baseline / final | Phone: baseline / final |
| --- | --- | --- | --- |
| Over 20 ms | 7 / 3 | 1311 (46 %) / 1702 (57 %) | 3 / 3 |
| Over 34 ms | 3 / 3 | 52 / 119 | 2 / 2 |
| p95 frame | 16.7 / 16.7 ms | 33.4 / 33.4 ms | 16.7 / 16.7 ms |

- **Coolant section and the sections after it:** no difference between the builds.
- **Memory:** heap after garbage collection over five repeated visits is 22.6–22.9 MB on the final build, with no
  growth.

### Focused reveal → live hand-over (story progress 0.07–0.14)

Each load is a fresh page, scrolled at the same pace.

**Phone.** Each load is a fresh page scrolled at the same pace. Valid loads only: each was taken while charging, with
no CPU throttling. Six loads per build:

| | Baseline | Final |
| --- | --- | --- |
| Over 20 ms | 9 | 21 |
| Over 34 ms | 5 | 18 |
| Loads with a hand-over stall | 1 | 5 |

The stall is a short burst at progress 0.099–0.101:

1. about four frames of 50–65 ms, which are three.js rendering the live scene as it fades in over the last frames;
2. then a single frame of about 350 ms with almost no script, as the reveal's frame images are released.

**What the profiles show.**

- **The stall is not new.** In profiled loads the baseline shows exactly the same burst at the same moment (2 of 3 loads,
  as for the final build).
- **How often it hits varies by session.** In an earlier session on the same story code (`c17d196`), the final build
  stalled in 1 of 6 loads against 2 of 6 for the baseline.
- **The index outline is not the cause.** A build identical to the final one except for its old soft halo stalled in
  2 of 3 loads.
- **Likely reason it hits the final build more often:** the lit room's extra GPU layers, which make the shared spike
  cross the line more readily.
- **Not changed.** Changing the hand-over mechanism is outside this pass.

**Desktop at 4× CPU, 3 loads per build:**

| | Baseline | Final |
| --- | --- | --- |
| Over 20 ms | 276 of 591 (47 %) | 341 of 565 (60 %) |
| Over 34 ms | 60 | 87 |
| Worst frame | 1100 ms | 83 ms |

### Practical impact

- **At normal CPU speed (desktop and phone emulation):** the final build matches the baseline, with the same p95
  (16.7–16.8 ms). Slow frames number a handful in both builds and vary from run to run. The worst stalls are no longer.
- **On a CPU four times slower,** the results differ between the two samples:
  - In the final build's pair, both builds were level: 64 % of frames over 20 ms each, 296 vs 305 over 34 ms.
  - In the earlier sample, the atelier had about 10 percentage points more 30 fps frames and twice as many frames of
    50 ms or more (4 % of the story).
  - So on slow CPUs the atelier can cost some smoothness; the worst stalls are no longer.
- **At the reveal → live hand-over on phones:** a single short hitch (about 0.35 s) shows up in some loads of both
  builds. In today's runs the final build hit it more often (see the hand-over test above).

  The extra per-frame work is the frame-edge shadow, redrawn with the frame, and the lit environment's style updates.
  Closing the gap would mean drawing the edge shadow differently, for example rendering it into the frames, which
  needs Blender.

## 3. Regression results

### Full suite (final build `UW9pHN9SJZglfJUl3dY3Z`)

| Check | Result |
| --- | --- |
| Production build | PASS |
| TypeScript (`tsc --noEmit`) | PASS |
| ESLint | PASS: 0 errors, 2 warnings (`<img>` in `CoolantCanvas.tsx` and `Nav.tsx`, both untouched) |
| Launch check | PASS (exit 0). One item open but not blocking: VentureRISE certificate file not received |
| Intro timing, 3 sizes | PASS: product first visible at 4.017–4.032 s, with no overlap between loader, logo and product. The first desktop run fell in a stretch of CPU throttling and was disturbed; three desktop re-runs read 4.017, 4.029 and 4.023 s |
| Model request during a continuous scroll; React commits | PASS: identical to the baseline |
| Repeated visits (story and new sections) | PASS: no heap growth (one transient reading on one visit), 3 canvases, stage covered past the section |
| Scroll-driven chapters: text fit at 5 sizes | PASS: every chapter fits |
| Continuous scroll shots, 4 sizes | PASS |
| Exploded view (chapter 08) | PASS: labels and copy fit; chapter 08 "360°" call to action reachable |
| 360° viewer, desktop and mobile | PASS: 4/4 quadrants; scroll position restored; no console errors |
| Coolant transition and showcase: stages at 6 sizes, 3D picks, keys, flow, cover, wheel, information rows | PASS |
| Reduced motion: site, viewer, coolant, gallery | PASS |
| No-WebGL: site fallback, viewer message, coolant still images and selection | PASS |
| Clickability, desktop and phone | PASS: identical to the previous validated run |
| Navigation: section integrity at 3 sizes, nav jumps, intro tagline | PASS: identical to the previous validated run |
| Family headline fit, 8 sizes | PASS at 7. 1280×720 has the 2 px kicker-under-nav overlap that predates the atelier |
| Gallery: each photo once, 7 sizes, reduced motion | PASS: 0 failed |
| Gallery and Ecosystem marquee, 9 configurations | PASS: 0 failed. All 9 logos load; Yashoda Hospitals and Pranaam Hospitals lead with "Customer"; other labels unchanged |
| Social and listing links, 5 sizes | PASS: 45/45 clickable, correct URLs, new tab with `noopener noreferrer` |
| Legal name | PASS: 0 failed; no "LLP" anywhere in the built page |
| WebKit harness: full journey, desktop and mobile | PASS: no console errors |
| WebKit harness: no-WebGL | PASS: fallbacks shown; coolant selection works; no console errors |
| WebKit harness: sections and links, desktop and mobile | PASS: 0 failed (re-run after updating the test from 7 to 9 logos); all links clickable |

Headless Chrome hung a few times (about 1 s stalls in both builds, and occasional captures stuck for hours). A
watchdog stopped stuck runs, and every affected check was re-run in full on the same build. Only complete runs are
counted.

## 4. Visual inspection

All eight chapters, First Light and the coolant hand-over were inspected on desktop and phone, as stills and as
recordings.

1. **Grounding.** The bag sits on its contact shadow in every live chapter. No chapter shows a floating product.
   Chapter 08's exploded parts float by design.
2. **Frame-edge shadow continuation.** No seams were found at any position.
3. **Chapter 02 → opening frames hand-over (0.31): confirmed, unchanged.**
   - The 0.105/0.115 and 0.565/0.575 hand-overs match closely.
   - At 0.315 the pre-rendered forward shadow is a narrower, denser wedge than the live one. During the cross-fade
     (about 230 px of scroll) the shadow tightens slightly.
4. **Corner artifact: confirmed, minor.** In the first opening frames there is a faint rectangle in the continued
   shadow.
   - The step is at most 5.8 grey levels in the frames alone, and 1.6 levels in what is shown during the cross-fade.
   - It is visible only with contrast stretched.
5. **Body text contrast** (graphite `#353c42` against the background behind each chapter's text column):

   | | Median | Worst case (darkest fifth of the column, bag passing behind the copy) |
   | --- | --- | --- |
   | Desktop | 8.1–8.3:1 | 7.0:1 (at 0.29 and 0.86) |
   | Phone | 8.0–8.3:1 | 7.6:1 |

   Headlines are about 14:1.
6. **Chapter index contrast: fixed.** Measured as the ink against the 1 px ring directly around each glyph stroke,
   worst 10 % of that ring, at all 52 story positions:

   | | Number | Chapter name | Muted "/ 08" |
   | --- | --- | --- | --- |
   | Desktop | 6.9:1 | 6.7:1 | 3.8:1 |
   | Phone | 6.8:1 | (not shown on phone) | 4.2:1 |

   - Before the fix the worst values were about 1.5:1 on phones (over the bag, 0.29–0.32) and 2.6:1 on desktop (over
     the reveal shadow, 0.06–0.08).
   - Over bare stone the index looks as before.
7. **Mobile layout.** Every chapter's copy fits at phone and phone-landscape sizes. In the coolant section, the coolant
   family, its picker and its information rows lay out correctly at all sizes.

### Files (`docs/design/atelier-final/`)

| File | Content |
| --- | --- |
| `before-after-desktop.jpg`, `before-after-phone.jpg` | Every chapter and the coolant showcase, baseline vs final |
| `all-chapters-desktop.jpg`, `all-chapters-phone.jpg` | The whole story by scroll progress, final build |
| `chapter02-handover-desktop.jpg`, `chapter02-handover-phone.jpg` | 0.305 / 0.315: as shown, frames alone, live alone |
| `coolant-handover-desktop.jpg`, `coolant-handover-phone.jpg` | Story end → coolant showcase → next section |
| `first-light-desktop.webp`, `first-light-phone.webp` | Load → intro → First Light, in real time (screencast) |
| `scroll-whole-story-*.webp`, `scroll-coolant-handover-*.webp` | Frame-by-frame scroll recordings: scroll positions at a constant rate, not playback speed |
| `ecosystem-customers-desktop.jpg`, `ecosystem-customers-phone.jpg` | The Ecosystem strip led by the two customers |

## 5. Known limitations

1. **The reveal → live hand-over hitch** on phones. This is a single ~0.35 s frame that also exists in the baseline;
   in today's runs the final build hit it in 5 of 6 loads against 1 of 6 (section 2).
2. **The 4× CPU performance gap** (section 2). In one sample, a slow CPU showed more 30 fps frames than the baseline;
   in the final pair the two builds were level. At normal speed the final build matches the baseline.
3. **The 0.31 shadow hand-over** tightens slightly during the cross-fade.
4. **The faint corner rectangle** in the first opening frames, at most 1.6 grey levels as shown.
5. **The two Cycles sequences** carry different shadows. They can't share one shadow without re-rendering, and Blender
   is not installed.
6. **The text-side scrim** lightens the stone behind the copy by about 10 grey levels. This is deliberate, for
   readability.
7. **The navigation** is ivory glass with graphite ink over the graphite sections too.
8. **The 360° viewer** keeps its dark studio and its contact-shadow bug (`ContactShadows` at +0.001 in
   `ViewerCanvas.tsx`). It is out of scope; the one-line fix is −0.005.
9. **The coolant headline** at 1280×720 sits 2 px under the navigation. This predates the atelier.
10. **The Yashoda Hospitals logo** is only published at 143 px wide on its official website, so it is slightly soft on
   high-density screens. A larger official file would be sharper.
11. **Not tested:** the Safari app and real devices.

## 6. Publication and package

- **Submission ZIP** (`infinos-website-submission-v4.zip`): this commit, without `tools/assets/gallery/` (the original
  gallery photographs) or any image or video under `docs/` (internal review screenshots, recordings and boards).
  - Before zipping it was built on its own and passed type-check, lint and launch-check.
  - It was face-scanned and checked against every withheld photo version.
  - Its `SUBMISSION_NOTES.md` lists the checks and the exclusions.
- **GitHub** (public repository `suchindra75-design/infinoswebsite-`): the same project without the original gallery
  photographs and the gallery review screenshots.
  - It is published as commits on top of the earlier clean snapshot; the private history that contains the photographs
    is not published.
  - New images are face-scanned before each push.

## 7. Launch status

- **Content:** the launch check finds no blockers. The VentureRISE certificate is an open, non-blocking item.
- **Release:** the final build, the launch check and the submission archive are verified. Before calling the site fully
  launch-ready, two things remain:
  - testing the Safari app and real phones, which can't be done on this machine;
  - deciding whether the slow-CPU smoothness and the occasional hand-over hitch on phones are acceptable for the devices
    you target.
