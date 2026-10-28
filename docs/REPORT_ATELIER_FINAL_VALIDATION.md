# Atelier with First Light: final validation

Status: validated on the production build of commit `c17d196` (build `_iXN72OTXjRXp1l47-3Is`). Every result below
comes from that build. The commit that adds this report changes only documentation.

The baseline is commit `1e34765` (the Cinematic site before the atelier), production build `dnkGgxjerYEAcCzfjbzIc`.
All runs used headless Chrome on this Mac (Intel). The WebKit runs used the project's WKWebView harness. Neither the
Safari app nor real devices were tested.

Images and recordings are in `docs/design/atelier-final/`.

## 1. Changes since the stage 2/3 report

These are performance fixes only. No visual change was intended, and stills of every chapter match the previous build
to within anti-aliasing and animation phase.

1. **Shadow map updates.** The live forward shadow's shadow map is re-rendered only while that shadow is visible, and
   then only when the pose changes. Its floor is drawn once on the warm-up frame, so it compiles early.
2. **Frame-edge strips** (commit `c17d196`). The photoreal frame is redrawn on every scrolled frame, because its
   composition moves, while the frame itself changes far less often. The averaged edge strips were tiny GPU canvases,
   and each draw of one into the frame canvas cost a GPU round trip. They are now software canvases, cached per frame
   and edge.
   - At 4× CPU slowdown, script time over the first 60 % of the story fell from 32.0 s to 24.8 s. The baseline is
     24.5 s.
   - Long animation frames fell from 53 to 10. The baseline has 6.

## 2. Performance

The runs were throttle-gated:

- Each run counts only if the Mac was charging and `CPU_Speed_Limit` stayed at 100 % in every 2-second sample.
- Invalid runs were discarded and repeated.
- Baseline and final runs alternated.

Each run is one continuous wheel journey: the whole story, the coolant section, the next section, then interaction
with the coolant fan.

### Story section

| | Desktop 1440×900 @2 | | Desktop at 4× CPU | | Phone 390×844 @3 | |
| --- | --- | --- | --- | --- | --- | --- |
| | Baseline | Final | Baseline | Final | Baseline | Final |
| Frames | 3017 | 3470 | 2839 | 2922 | 5131 | 4236 |
| Over 20 ms | 3 | 7 | 1271 (45 %) | 1586 (54 %) | 3 | 6 |
| Over 34 ms | 2 | 6 | 34 (1.2 %) | 85 (2.9 %) | 2 | 6 |
| p95 frame | 16.8 ms | 16.7 ms | 33.4 ms | 33.4 ms | 16.7 ms | 16.8 ms |
| Worst frame | 1550 ms | 383 ms | 1183 ms | 317 ms | 1033 ms | 1017 ms |
| Long animation frames (> 50 ms) | 2 | 5 | 6 | 10 | 2 | 6 |

- **Coolant section and the sections after it:** no difference. At normal CPU speed neither build has a frame over
  34 ms.
- **Memory:** heap after garbage collection over five repeated visits is 23.2 MB for the final build and 22.6–22.9 MB
  for the baseline, with no growth.
- **Shader stalls:** none in either build.

### Focused reveal → live hand-over (story progress 0.07–0.14)

Each load is a fresh page, scrolled at the same pace.

| | Phone: baseline (6 loads) | Phone: final (6 loads) | 4× CPU: baseline (3 loads) | 4× CPU: final (3 loads) |
| --- | --- | --- | --- | --- |
| Frames | 1935 | 2172 | 600 | 642 |
| Over 20 ms | 13 | 8 | 266 (44 %) | 339 (53 %) |
| Over 34 ms | 8 | 5 | 43 (7 %) | 97 (15 %) |
| Worst frame | 1045 ms | 1414 ms | 900 ms | 417 ms |

- **Phone:** the four extra long frames of the final journey run came from one intermittent hand-over stall. It is not
  systematic: the baseline stalled at the hand-over in 2 of its 6 loads, the final build in 1 of 6.
- **4× CPU:** the gap is systematic. In this window the main thread is saturated in both builds. Total script time per
  window overlaps: 5.1–5.2 s for the final build, 4.8–6.7 s for the baseline. The atelier adds per-frame work, mostly
  the frame-edge extension redrawn with the frame and the environment's style updates. That pushes more frames from
  one vsync to two.

### Practical impact

- **At normal CPU speed (desktop and phone emulation):** typical frame time is unchanged (p95 16.7–16.8 ms). A full
  story scroll has a handful of extra slow frames, and the worst stall is no worse.
- **On a CPU four times slower:** the baseline already runs the story at 30 fps for nearly half of its frames.
  - The atelier adds about 9 percentage points more 30 fps frames.
  - Frames of 50 ms or more roughly double: 2.9 % of the whole story, 15 % within the hand-over window.
  - The worst stalls are shorter.

  Closing this gap would mean changing how the frame-edge shadow is drawn, for example rendering it into the frames.
  That needs Blender, which is not installed.

## 3. Regression results (build `_iXN72OTXjRXp1l47-3Is`)

| Check | Result |
| --- | --- |
| Production build | PASS |
| TypeScript (`tsc --noEmit`) | PASS |
| ESLint | PASS: 0 errors, 2 warnings (`<img>` in `CoolantCanvas.tsx` and `Nav.tsx`, both untouched) |
| Launch check | PASS (exit 0). One item open but not blocking: VentureRISE certificate file not received |
| Intro timing, 3 sizes | PASS: product first visible at 4.023–4.027 s; no overlap between loader, logo and product |
| Model request during a continuous scroll; React commits | PASS: identical to the baseline |
| Repeated visits (story and new sections) | PASS: no heap growth, 3 canvases, stage covered past the section |
| Scroll-driven chapters: text fit at 5 sizes | PASS: every chapter fits |
| Continuous scroll shots, 4 sizes | PASS |
| Reveal → live, chapter 02 and interior hand-overs | PASS, with the known 0.31 shadow tightening (see 4.1) |
| Exploded view (chapter 08), all sizes | PASS: labels and copy fit; chapter 08 "360°" call to action reachable |
| 360° viewer, desktop and mobile | PASS: 4/4 quadrants; scroll position restored; no console errors |
| Coolant transition and showcase: stages at 6 sizes, 3D picks, keys, flow, cover, wheel, information rows | PASS |
| Reduced motion: site, viewer, coolant, gallery | PASS |
| No-WebGL: site fallback, viewer message, coolant still images and selection | PASS |
| Clickability, desktop and phone | PASS |
| Navigation: section integrity at 3 sizes, nav jumps, intro tagline | PASS: identical to the previous verified run |
| Family headline fit, 8 sizes | PASS at 7. 1280×720 has the 2 px kicker-under-nav overlap that predates the atelier |
| Gallery: each photo once, 7 sizes, reduced motion and public mode | PASS: 0 failed |
| Gallery and ecosystem marquee, 9 configurations | PASS: 0 failed |
| Social and listing links, 5 sizes | PASS: 45/45 clickable, correct URLs, new tab with `noopener noreferrer` |
| Legal name | PASS: 0 failed; no "LLP" anywhere in the built page |
| WebKit harness: full journey, desktop and mobile | PASS: no console errors |
| WebKit harness: no-WebGL | PASS: fallbacks shown; coolant selection works; no console errors |
| WebKit harness: sections and links, desktop and mobile | PASS: 0 failed; all links clickable |

Two checks hung once in headless Chrome and were stopped: the phone gallery check and the desktop chapter-index
capture. Both were re-run in full on the same build and are counted above only from the complete re-runs.

## 4. Visual inspection

All eight chapters, First Light and the coolant hand-over were inspected on desktop and phone, as stills and as
recordings. The before/after boards compare every chapter with the baseline.

### 4.1 Findings

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
6. **Chapter index contrast: defect, not fixed.** The index sits low on the set on desktop and under the navigation on
   phones. Over bare stone it reads at 9–11:1; the muted "/ 08" reads at 4.6–5.5:1. Over dark areas it does not:
   - **Phone, 0.29–0.32 (the chapter 02 close-up):** "02 / 08" lies over the black bag and is close to illegible,
     about 1.0–1.4:1. The stone halo shows only as a grey glow there.
   - **Desktop, 0.06–0.08 (the reveal's shadow):** "01 / 08" reads at about 2.3:1, 1.9:1 at worst.
   - **Cause:** the atelier's graphite ink. The old dark studio's light ink read fine over the bag.
   - **Proposed fix (needs approval):** a denser stone outline on the index (`text-shadow` only), invisible over bare
     stone. It changes the look over dark areas and needs a new validation cycle, so it was not applied. The index is
     `aria-hidden`; the chapter copy itself is not affected.
7. **Mobile layout.** Every chapter's copy fits at phone and phone-landscape sizes (section 3). In the coolant section,
   the coolant family, its picker and its information rows lay out correctly at all sizes.

### 4.2 Files (`docs/design/atelier-final/`)

| File | Content |
| --- | --- |
| `before-after-desktop.jpg`, `before-after-phone.jpg` | Every chapter and the coolant showcase, baseline vs final |
| `all-chapters-desktop.jpg`, `all-chapters-phone.jpg` | The whole story by scroll progress, final build |
| `chapter02-handover-desktop.jpg`, `chapter02-handover-phone.jpg` | 0.305 / 0.315: as shown, frames alone, live alone |
| `coolant-handover-desktop.jpg`, `coolant-handover-phone.jpg` | Story end → coolant showcase → next section |
| `first-light-desktop.webp`, `first-light-phone.webp` | Load → intro → First Light, in real time (screencast) |
| `scroll-whole-story-*.webp`, `scroll-coolant-handover-*.webp` | Frame-by-frame scroll recordings: scroll positions at a constant rate, not playback speed |

## 5. Known limitations

1. **Chapter index contrast** over the bag on phones (0.29–0.32) and over the reveal shadow on desktop (0.06–0.08), as
   in 4.1. Not fixed.
2. **The 4× CPU performance gap** (section 2). On a slow CPU the story has more 30 fps frames than the baseline. At
   normal speed there is no measurable change in typical frame time.
3. **The 0.31 shadow hand-over** tightens slightly during the cross-fade.
4. **The faint corner rectangle** in the first opening frames, at most 1.6 grey levels as shown.
5. **The two Cycles sequences** carry different shadows. They can't share one shadow without re-rendering, and Blender
   is not installed.
6. **The text-side scrim** lightens the stone behind the copy by about 10 grey levels. This is deliberate, for
   readability.
7. **The navigation** is ivory glass with graphite ink over the graphite sections too.
8. **The 360° viewer** keeps its dark studio and its contact-shadow bug (`ContactShadows` at +0.001 in
   `ViewerCanvas.tsx`). It is out of scope; the one-line fix is −0.005.
9. **Headless Chrome stalls.** Single stalls of about 1 s with no script time appear at random in both builds. They make
   worst-frame figures noisy.
10. **Not tested:** the Safari app and real devices.
11. **The coolant headline** at 1280×720 sits 2 px under the navigation. This predates the atelier.

## 6. Launch status

- **Content:** the launch check finds no blockers. The VentureRISE certificate is an open, non-blocking item.
- **Release:** this is not called fully launch-ready. The chapter index contrast defect and the 4× CPU gap need a
  decision, and the Safari app and real devices are untested.
