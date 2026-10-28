# INFINOS: "INFINOS in Action" gallery and "Our Ecosystem" — implementation report

- **Final build:** `nTcdYz2sko8W-_7XWU90S`, commit `6cc08a6`.
- **Working baseline:** the accepted social-links Phase 2 build `TeG6vFmkFtJdpyXhzoNDv`
  (`infinos-website-coolants-phase2.zip`, SHA-256 `26c21734…`, untouched; that ZIP is also the rollback).
- **Original baseline:** `infinos-website-coolants-stabilised.zip`, also untouched.

## 1. What was built

### Placement (as approved)

```
… Range → INFINOS in Action (gallery) → Company → Our Ecosystem → Contact (with footer)
```

Navigation is unchanged.

### INFINOS in Action (gallery)

| Element | Implementation |
|---|---|
| Head | Kicker "Gallery", title "INFINOS in action.", lede "Product demonstrations, discussions and visits." (the site's section style) |
| Row | Full-bleed photographs at one height: 420 px on desktop, 340 on tablet, 250 on phone, 220 on a landscape phone. Widths follow each photo's own ratio, never cropped or stretched. 22 px gaps (14 on phone); a very soft fade at the screen edges |
| Captions | "Product demonstration · Cargomen Logistics", "Product presentation", "Smart City Living Lab"; none for the group photograph |
| Motion | A continuous leftward drift: 22 px/s on desktop, about 16 px/s on narrow screens. The loop is seamless (measured, section 3) |
| Pause | Eased stop on mouse hover, keyboard focus, press or drag, and with the Pause/Play button; resumes about 1.5 s after the interaction |
| Manual | Drag (mouse) or swipe (touch, with inertia); horizontal trackpad swipe; ← → buttons and the arrow keys step to the next photo. A vertical swipe over the row still scrolls the page |
| Hover | The photo brightens slightly (opacity 0.9 → 1) and its caption lightens; no scaling or glow |
| Reduced motion | No drift. A native horizontal scroll row with snap points and the ← → buttons |
| Images | WebP at 560 and 1080 px wide (the originals are 1080 px), with `srcset` and per-photo `sizes`. `width`/`height` reserve the space, so nothing shifts. Lazy until the section is within one screen, then all copies load, so nothing arrives blank mid-drift |

### Our Ecosystem

| Element | Implementation |
|---|---|
| Head | Kicker "Ecosystem", title "Our Ecosystem.", lede "Programmes, institutions and organisations connected with INFINOS, each shown with its relationship." |
| Recognition | Label "Recognition", statement "Selected among the Top 16 startups", detail "VentureRISE Global Startup Challenge 2024/25 · ESDM category". No "winner" or "award" wording. **No "View certificate" yet: the certificate file was not received (section 4)** |
| Logo marquee | A second, independent marquee at half the gallery's speed (11 px/s). Every logo sits on an identical muted off-white plate (208×116 px; 152 px wide on phone): no border, shadow or glow. Each logo is centred at its original proportions and sized to a similar visual area within the plate. Logos supplied on white blend into the plate (CSS multiply) instead of showing a second white box |
| Labels | Name, then the relationship in small mono type: Startup India "Earlier registration"; Amrita TBI "Institutional support"; Agnii "Featured"; Astromerge, Lunar Mission One, WH+, HelioX Cosmos "Earlier collaboration" |
| Note | "Relationships as listed on the previous INFINOS website. Earlier collaborations are not necessarily current partnerships." |
| Pause / reduced motion | Pause on hover, focus and press, plus a Pause/Play button; drag and swipe. Reduced motion: a static, centred, wrapped grid |
| Not published | DPIIT (as you decided); the LLP-era INFINOS mark; Cargomen as a partner |

### Photo publication consent

All four photographs show identifiable people whose publication consent is not confirmed. So:

- **Visitors don't see them.** A photo is shown only once its `consent` is `'confirmed'` in `src/content/gallery.ts`.
  With none confirmed, the gallery section isn't rendered at all, and no gallery image is requested (tested).
- **Review mode.** `/?review=photos` shows the gallery with a "Consent pending · not published" tag on each photo.
  This is how the gallery was reviewed, screenshotted and tested on the same build.
- **Launch check.** `npm run launch-check` fails while any photo is pending. The details are in
  `docs/LAUNCH_CHECKLIST.md`, including that the photo files themselves are part of the build and reachable by
  direct URL if deployed.

### Architecture

| File | Role |
|---|---|
| `src/content/gallery.ts`, `src/content/ecosystem.ts` (new) | Central content: photos (sizes, alt text, captions, consent), logos (relationship, pending items), recognition text |
| `src/components/sections/Marquee.tsx` (new) | One reusable marquee, used twice independently |
| `src/components/sections/GallerySection.tsx`, `EcosystemSection.tsx` (new) | The two sections |
| `src/components/Experience.tsx` | Inserts the two sections (5 lines) |
| `src/components/sections/PlatformSections.tsx` | `Head` exported for reuse; nothing else changed |
| `src/app/globals.css` | Styles for the marquee, gallery and ecosystem (appended) |
| `public/images/gallery/`, `public/images/ecosystem/` | Encoded photos and logos |
| `tools/encode_gallery_ecosystem.mjs`, `tools/assets/` | Re-runnable encoding with `sharp` (already installed) from the untouched sources |
| `scripts/launch-check.mjs`, `package.json` (`launch-check` script) | Launch blockers |

**How the marquee runs.**
- **No React renders while moving.** Motion is a CSS transform written directly to the track.
- **One animation loop.** It runs on GSAP's ticker, the same requestAnimationFrame as Lenis, and only while the
  marquee is on screen.
- **Separate from the 3D work.** It never wakes the shared 3D frame loop, adds no WebGL and no dependency, and doesn't
  interact with ScrollTrigger or Lenis.
- **Accessible.** Copies used for the seamless loop are `aria-hidden` and `inert`.

**Not modified:** the intro, the bag model and story, MOVE, the eight chapters, the coolant showcase, the 360° viewer,
navigation, the social links, Justdial and the company positioning.

## 2. Asset inventory

### Photographs (owner uploads, 2026-10-15)

| Uploaded file | Site file | Size | Caption | Consent |
|---|---|---|---|---|
| `2.jpg` (1080×811) | `cargomen-demonstration-{560,1080}.webp` | 28 / 66 KB | "Product demonstration · Cargomen Logistics" | Pending: five identifiable participants |
| `4.jpg` (1080×807) | `product-presentation-{560,1080}.webp` | 22 / 49 KB | "Product presentation" | Pending: presenter, team, external visitors |
| `3.jpg` (1080×806) | `smart-city-living-lab-{560,1080}.webp` | 36 / 95 KB | "Smart City Living Lab" | Pending: participants, external visitors |
| `1.jpg` (1080×603) | `group-mural-{560,1080}.webp` | 26 / 61 KB | none (event unconfirmed) | Pending: fourteen people, including external visitors |

The uploaded screenshots of the old website (`5.jpg`, `6.jpg`, `7.jpg`) were not used on the site.

### Logos (original files from the previous INFINOS website, downloaded with your approval)

| Organisation | Original | Site file | Processing |
|---|---|---|---|
| Startup India | `img-1/f-2.png` 656×146 | `startup-india.png` 654×146 | transparent margin trimmed |
| Amrita TBI | `img-1/f-3.jpg` 350×99 (the "Funded by Amrita TBI" banner) | `amrita-tbi.png` 101×99 | **only the "amrita tbi" mark** (the banner's left panel), without the "Funded by" wording, which is unconfirmed |
| Agnii | `img-1/f-4.jpg` 180×147 | `agnii.png` 139×91 | white margin trimmed; blends into the plate |
| Astromerge | `img-1/hw-Asset-1@2x.png` 1319×254 | `astromerge.png` 640×114 | margin trimmed, scaled down |
| Lunar Mission One | `img-1/LUNAR.png` 320×320 | `lunar-mission-one.png` 320×320 | unchanged (its black square is the logo) |
| WH+ | `img-1/worldOrg.png` 320×320 | `wh-plus.png` 282×116 | white margin trimmed; blends into the plate. Shown only as "WH+" |
| HelioX Cosmos | `img-1/HeliloX.jpg` 320×320 | `heliox-cosmos.webp` 320×320 | blends into the plate |
| DPIIT | not downloaded | — | not published (your decision) |

No logo was redrawn, recoloured or stretched. Amrita TBI (101 px) and Agnii (139 px) are the only originals available
and look soft on high-density screens; official files from those organisations would fix that.

### VentureRISE certificate

**Not available to this project yet, so not used, recreated or substituted.**

What was searched:
- every attachment in the conversation record, including nested content;
- the session's upload folder;
- the Claude app's local storage around the upload time.

What was found:
- Your gallery request arrived with exactly seven images: the four photographs and three old-site screenshots.
- One earlier message carried the INFINOS logo PNG.

A failed or oversized attachment can drop silently, so this is not proof that it was never sent. The recognition
statement uses the facts you stated. "View certificate" will be built and tested once the exact file is available.

## 3. Tests on the final build `nTcdYz2sko8W-_7XWU90S`

### Test conditions and validity

- **Performance runs were validated against throttling.** On 2026-10-15 the Mac lost power during a test batch:
  - the battery drained on AC;
  - the CPU was throttled to 22–67%;
  - another Claude session (the "SIMPLIN SCHOOL" project) was running a Next.js build at the same time.

  So every performance and WebKit run here was gated:
  - **Before:** the Mac must be charging (here: the battery was full) with the CPU at 100% for 90 consecutive
    seconds.
  - **During:** the CPU speed limit was sampled every 2 seconds.
  - **Rule:** a run with any sample below 100% would have been discarded and repeated.
  - **Result: none was discarded; every reported run kept the CPU at 100% throughout.**
- **Low Power Mode.** macOS Low Power Mode was on, a system setting I did not change. Baseline and final ran back to
  back under the same conditions.
- **Functional checks** (correctness rather than speed) ran while charging, with the CPU partly throttled (as low as
  22%). That doesn't affect their pass/fail results: the marquee motion is time-based, not frame-based.
- **The test suite was rebuilt.** The restart cleared `/private/tmp`, including the test suite. It was rebuilt by
  replaying, from the conversation record, exactly the operations that had created and edited each test file: 73
  operations, every edit assertion passing.
  - Check: the rebuilt WebKit harness compiles to exactly the original binary size (72,264 bytes).
  - Check: the rebuilt `test.js` matches the previously read file.
  - One test-environment gap (a missing screenshot folder for the resilience check) was found and fixed; that check
    was re-run and passes.
- **Builds.** Final `nTcdYz2sko8W-_7XWU90S` (commit `6cc08a6`) on port 3200. Baseline `u3B55NQq34y5wJmlbs0nB`, the
  accepted social-links Phase 2 commit `16ed91e`, built from `git archive`, on port 3300.

### Performance: final build vs the accepted Phase 2 build (Chrome; all ten runs valid)

#### Normal CPU, desktop 1440×900 at 2×

| Part of the journey | frames (base → final) | frames > 20 ms | frames > 34 ms | longest frame (ms) | p95 (ms) |
|---|---|---|---|---|---|
| story | 3866 → 3830 | 1 → 1 | 1 → 1 | 50 → 67 | 16.7 → 16.8 |
| coolant | 876 → 869 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |
| after | 508 → 508 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.8 |
| seek | 150 → 150 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.7 |
| hover | 475 → 480 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |
| select | 192 → 192 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.7 |

Long animation frames (> 50 ms) over the whole run: 1 → 1. Shader compile stalls > 4 ms: 0 → 0. Console errors: none → none.

#### 4× slower CPU (simulated), desktop

| Part of the journey | frames (base → final) | frames > 20 ms | frames > 34 ms | longest frame (ms) | p95 (ms) |
|---|---|---|---|---|---|
| story | 2789 → 2733 | 1345 → 1334 | 53 → 62 | 83 → 83 | 33.4 → 33.4 |
| coolant | 774 → 778 | 46 → 39 | 0 → 0 | 33 → 33 | 33.3 → 33.2 |
| after | 465 → 452 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |
| seek | 150 → 150 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.8 |
| hover | 468 → 468 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.8 |
| select | 197 → 198 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.8 |

Long animation frames (> 50 ms) over the whole run: 5 → 10. Shader compile stalls > 4 ms: 0 → 0. Console errors: none → none.

#### Phone emulation 390×844 at 3×

| Part of the journey | frames (base → final) | frames > 20 ms | frames > 34 ms | longest frame (ms) | p95 (ms) |
|---|---|---|---|---|---|
| story | 5453 → 5460 | 1 → 1 | 0 → 1 | 33 → 50 | 16.8 → 16.8 |
| coolant | 1224 → 1224 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |
| after | 689 → 687 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.7 |
| seek | 150 → 150 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.7 |
| hover | 480 → 474 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.8 |
| select | 192 → 192 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.7 |

Long animation frames (> 50 ms) over the whole run: 0 → 1. Shader compile stalls > 4 ms: 0 → 0. Console errors: none → none.

#### Scrolling the moment the intro ends, desktop

| Part of the journey | frames (base → final) | frames > 20 ms | frames > 34 ms | longest frame (ms) | p95 (ms) |
|---|---|---|---|---|---|
| story | 3883 → 3890 | 5 → 3 | 2 → 1 | 50 → 50 | 16.7 → 16.7 |
| coolant | 871 → 871 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.8 |
| after | 508 → 508 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |
| seek | 150 → 150 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.7 |
| hover | 476 → 477 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |
| select | 192 → 192 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.8 |

Long animation frames (> 50 ms) over the whole run: 3 → 2. Shader compile stalls > 4 ms: 0 → 0. Console errors: none → none.

#### Scrolling the moment the intro ends, 4× CPU

| Part of the journey | frames (base → final) | frames > 20 ms | frames > 34 ms | longest frame (ms) | p95 (ms) |
|---|---|---|---|---|---|
| story | 2832 → 2730 | 1368 → 1333 | 60 → 66 | 133 → 117 | 33.4 → 33.4 |
| coolant | 787 → 651 | 45 → 42 | 0 → 0 | 33 → 33 | 33.3 → 33.3 |
| after | 470 → 438 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.8 |
| seek | 150 → 150 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |
| hover | 468 → 467 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |
| select | 196 → 197 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.8 |

Long animation frames (> 50 ms) over the whole run: 8 → 10. Shader compile stalls > 4 ms: 0 → 0. Console errors: none → none.

**Notes.**
- **These journeys** cover the intro, the bag story, the coolant showcase and the start of the next section; the new
  sections are lower on the page and are measured separately below.
- **The final build matches the baseline:**
  - the coolant section has 0 frames over 34 ms in every scenario;
  - selection and hover peak at 17 ms;
  - no shader stalls and no console errors.
- **Frame counts are not a quality measure:** they depend on the test's own timing (immediate 4×: coolant 787 → 651,
  same quality).

### The new sections: frame timing while they are on screen (Chrome, final build, runs valid)

| Measurement | Normal CPU | 4× slower CPU |
|---|---|---|
| Gallery on screen and moving, 5 s | 299 frames, p95 16.7 ms, 0 over 20 ms, max 17 ms | 299 frames, p95 16.8 ms, 0 over 20 ms, max 17 ms |
| Logo marquee on screen and moving, 5 s | 299 frames, p95 16.8 ms, 0 over 20 ms, max 17 ms | 299 frames, p95 16.8 ms, 0 over 20 ms, max 17 ms |
| Continuous scroll from Range through both sections to Contact | 539 frames, 0 over 20 ms, max 17 ms | 538 frames, 1 over 20 ms, max 33 ms |
| React commits during 3 s of motion | 0 | — |
| Transform writes while off screen (story, coolant section) | 0 | — |

### Functional checks on the final build (Chrome)

| Area | Result |
|---|---|
| **Gallery and ecosystem** (5 sizes; reduced motion at 2 sizes; public mode at 2 sizes) | **All checks pass, 0 failures.** Continuity of every visible item checked frame by frame, including across the wrap (6 steps forward): 0 jumps, 0 gap errors. Speeds 22 and 11 px/s (×0.72 on narrow screens). Pause on hover, keyboard focus and the Pause button, with resume. Mouse drag, touch swipe, and a vertical swipe still scrolls the page. ArrowRight lands the next photo at the row start. Photos and logos load at their original proportions, logos on identical plates. Captions, labels, recognition wording and note exact. DPIIT absent. No horizontal overflow. No layout shift. 0 React commits during motion. 0 transform writes while off screen. The coolant section is intact after a full reverse scroll |
| Reduced motion | Gallery becomes a native scroll row with no drift, and Next scrolls one photo; logos become a static wrapped grid, all visible |
| Public mode (no `?review`) | Gallery not rendered and **no gallery image requested**; ecosystem rendered |
| Repeated visits through the new sections (5 reloads, review mode) | Heap after GC 21.8 MB every time; 3 canvases; 2 marquees; no console errors |
| Existing regression suite | Unchanged from the Phase 2 build: coolant stages at 6 sizes, picks on the glided fan, reduced and no-WebGL fallbacks, scroll behaviour, clickability, picks, keyboard, flow, cover and hand-over, continuous scroll at 4 sizes, chapter fit at 5 sizes, 360° viewer (desktop, mobile), resilience, intro timing at 3 sizes, positioning sections and tagline, 0 "LLP", nine-row coolant layout, wheel, headline fit at 8 sizes, all 9 social and listing links at 5 sizes. No console errors |
| React commits (coolant hold) | Identical to the baseline: scroll 0, 12 selections 13, hover 8; 3D canvas 0 |
| Repeated visits (5 reloads) | Baseline 22.7–22.9 MB, final 22.9–23.2 MB after GC, flat |
| Launch check | Exits with 5 blockers (4 photo consents, legal name) and 1 open item (certificate), as intended |

### WebKit (Safari's engine, WKWebView harness on this Mac; every run valid)

| Run | Result |
|---|---|
| Full test, desktop 1440×900 | Coolant section: 99 frames, median 33 ms, max 35 ms, 0 over 50 ms. Buttons, rapid selection, real-click 3D picks (each opens its information), clickability, nav jump, 360° viewer, 5 passes: all pass. No console errors |
| Full test, phone 390×844 | Coolant section: max 60 ms, 4 over 50 ms (stabilised build: max 61 ms, 6). All functional checks pass. No console errors. **Visit 1 had a 4.5 s stall at the bag's first reveal**: the known WebKit cold-start shader compile (caches were cold after the restart). Later visits show the usual ~0.6 s |
| No WebGL | Bag fallback; the still swaps with the selection (organic −171 px, eutectic −259 px) and returns on "All coolants"; information opens |
| New sections, desktop and phone (review mode) | **All checks pass, 0 failures**: photos and logos loaded at their proportions; speeds 22 / 11 px/s (15.8 / 7.9 on phone); seamless while drifting and across the wrap; Pause button and focus pause; wording; DPIIT absent; no overflow; no console errors |
| Social and listing links, desktop and phone | All 9 links clickable with the right URL, new tab, `noopener noreferrer` |
| Repeated visits, phone, 4 visits (process memory after each journey) | Final 269 → 395 → 405 → 412 MB; baseline 253 → 402 → 412 → 418 MB. The final build is not higher. Visit 1's full checks pass with no console errors |

An earlier pair of WebKit visit runs used the visits-only test file, which lacks the clickability helper. Its visit 1
stopped at the clickability step ("TEST FAILED" in the log, identically for both builds). They were re-run with the
full test file (the row above).

### Not verified

- **The Safari app and real devices.** WebKit was tested through the WKWebView harness only.
- **The certificate viewer.** "View certificate" doesn't exist yet, because the certificate file hasn't reached this
  project.
- **Absolute (unthrottled-by-Low-Power-Mode) performance.** Low Power Mode was on throughout; the comparison is
  relative, under identical conditions.


## 4. Outstanding questions

1. **Photo consent** for the four photographs (launch blocker; `docs/LAUNCH_CHECKLIST.md` B1).
2. **VentureRISE certificate file.** It hasn't reached this session. Your gallery request arrived with seven images
   and no certificate; the conversation record and the app's local storage hold no other upload. Please re-attach
   it, or put it in the project folder.
3. **Exact registered company name** (launch blocker B2). The certificate reportedly names "INFINOSTECH PVT. LTD.".
4. **Startup India:** current status for the Private Limited company.
5. **Amrita TBI:** "supported" or "funded", and the period.
6. **DPIIT:** verification for the Private Limited company (not published).
7. **The group photograph's event**, if you want a caption.
8. Optional: official high-resolution logos for Amrita TBI and Agnii.

## 5. Screenshots (`docs/screenshots/gallery-ecosystem/`)

- `preview_desktop_phone.png`: both sections on desktop and phone (review mode).
- `review_{desktop,tabletL,tabletP,phone,phoneL}_{gallery,ecosystem}.png`: every size (review mode; the orange
  "Consent pending" tags appear only in review mode).
- `reduced_{desktop,phone}_*.png`: reduced motion.
- `webkit/`: WebKit desktop and phone (gallery, ecosystem, contact links).
- `regression/`: the existing suite on the final build (coolant stages, fallbacks, flow, cover, continuous scroll,
  chapters, sections, intro, nine-row layouts, headline fit, social links).

## 6. Update 2026-10-16: the gallery made public (build `bmsCEwgdO8AU0SHMMLaul`)

**What changed:**
- The gallery is shown to every visitor; `?review=photos` is no longer needed.
- Design, motion, controls and layouts are unchanged.
- Only images without identifiable people are published:

| Image | Decision |
|---|---|
| Cargomen demonstration | **Published as a crop** (580×435) below everyone's chin: the two INFINOS bags, hands and the desk globe; no faces or heads. Caption unchanged |
| Smart City Living Lab | **Published as a crop** (490×276) of the room above everyone's head: the screen and the device shelf; no people. Caption unchanged |
| Product presentation | **Excluded.** The bag is only about 80×60 px beside the presenter's face; no usable crop without people |
| Group photograph | **Excluded.** People across the frame; above them only a third party's branded mural |

**Files and code:**
- The four full photographs were **removed from the website build** (`public/images/gallery/`), so they can't be fetched
  by URL. Their originals stay in `tools/assets/gallery/`.
- The lede now reads "Product demonstrations and visits." ("discussions" is no longer pictured).
- The "Consent pending" tag appears only in review mode, for a future pending photo; no public photo has it.
- Review mode is kept.
- Files changed: `src/content/gallery.ts`, `src/components/sections/GallerySection.tsx`,
  `tools/encode_gallery_ecosystem.mjs`, `public/images/gallery/`. Nothing else.

**Tests on this exact build:**

| Check | Result |
|---|---|
| TypeScript, ESLint, production build | Pass. ESLint shows only the two pre-existing warnings, in files not touched |
| Gallery and ecosystem suite, public page, 5 sizes (desktop, tablet landscape and portrait, phone, landscape phone) | 0 failures: the two crops load at their proportions, captions exact, seamless loop (also across the wrap), speeds, pause on hover / focus / button, drag and swipe, arrow keys, no overflow, no layout shift, 0 React commits in motion, idle while off screen, the coolant section intact after a reverse scroll |
| Public mode, desktop and phone | Gallery rendered. **Only the two crop files requested; no full photograph.** No "Consent pending" text on the page |
| Reduced motion, desktop and phone | No drift; logos as a static grid. On desktop the two-photo row is only 60 px wider than the screen, so "Next" scrolls the full 60 px (verified separately) |
| Review mode | Same two crops, 0 failures |
| Existing checks | All sections and the footer (heights unchanged), coolant stages on desktop and phone, intro timing (0 overlap), 360° viewer on desktop and mobile, clickability, React commits as before, 9 social and listing links clickable |
| Repeated visits through the new sections (public page, 5 reloads) | Heap 21.8 MB every time, no console errors |
| WebKit | New sections on desktop and phone: 0 failures. Links: 9 clickable, no console errors |
| Frame timing with the gallery on screen (CPU at 100% throughout) | 60 fps, 0 frames over 20 ms; scrolling through both sections max 17 ms |
| Launch check | 1 blocker (exact registered company name), 1 open item (certificate) |

**Not re-run for this change:**
- The full two-hour, throttle-gated performance suite against the Phase 2 build. The change only swaps gallery images;
  the last full run is section 3.
- The full WebKit regression runs (desktop and phone full test, no-WebGL, visits).
- The Safari app and real devices remain untested.

## 7. Update 2026-10-16: gallery presentation (build `36U-T58xOwTX_vZRIep1Z`)

**What changed** (nothing outside the gallery; the ecosystem row and every other section are unchanged):
- **No repetition.** The gallery no longer uses the seamless loop, which copied the two photos to fill the screen
  (A B A B …). Each photo now appears once (`loop={false}` in `Marquee.tsx`, used by the gallery only).
- **Where the pair fits (700 px wide and up): a still, centred pair**, equal size, 20–32 px apart, no controls.
- **Narrower screens: a slow glide** from one photo to the other and back (about 10 px/s). It rests 2.6 s at each end,
  eases into each end over about 2.4 s and eases out again; there is no wrap, so no jump. Previous / Pause / Next, arrow
  keys, drag and touch swipe (clamped at the ends) and horizontal trackpad swipes all work. Hover and keyboard focus
  pause it; a mouse press no longer leaves it paused.
- **Reduced motion:** no glide — the still pair where it fits, otherwise a native scroll row whose buttons and arrow
  keys scroll.
- **New crops, both 5:3**, from the same originals: the Cargomen demonstration from chest height down (the two bags,
  the hands holding them, the globe), and the Smart City Living Lab with the whole screen and the device shelf and less
  ceiling. No faces (Apple Vision face detection: 0 in both).
- **Size:** both photos share one width, at most 480 px (the Smart City crop is 417 px wide, so at most 1.15×); height
  follows the 5:3 ratio, no stretching. Captions unchanged in style.
- Files: `Marquee.tsx`, `GallerySection.tsx`, `globals.css` (gallery and `[data-static]` rules),
  `content/gallery.ts`, `tools/encode_gallery_ecosystem.mjs`, `public/images/gallery/`.

**Tests on this build:** production build, TypeScript and ESLint pass (the two earlier warnings only). The new gallery
suite (scratchpad `qa/gallery.mjs`) passes at 1440, 1280, 1024, 768 (touch), 844×390 (touch), 640 (mouse), 390
(touch, including a 40 s full glide) and 320 (touch), and with reduced motion at 1440, 390 and 320: 0 failures. The
adapted marquee suite (ecosystem, public and reduced modes), legal name, social links, clickability and WebKit (desktop
and phone) pass. Screenshots: `docs/screenshots/gallery-polish/` (crops only, no identifiable people).

**Not re-run:** the full throttle-gated performance suite and the full WebKit regression; the Safari app and real
devices remain untested.
