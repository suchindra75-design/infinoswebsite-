# INFINOS: coolant showcase phase 2, positioning correction and company-identity groundwork

This report covers the final build `TeG6vFmkFtJdpyXhzoNDv`, from commit `829b6d6` on top of the tag `baseline-stabilised`. Every
measurement below was taken on exactly that build and compared with the stabilised baseline build
(`3WkaIuhv_RSyek4-YWzDi`, the same source as `infinos-website-coolants-stabilised.zip`, which was left untouched).

It covers three pieces of work:

1. **Coolant showcase phase 2**, the approved Step 2.
2. **Positioning correction**: INFINOS is a smart cold-chain and temperature-controlled transportation technology
   company, not a healthcare-only company.
3. **Company-information migration**: the audit, waiting for approval (see `docs/MIGRATION_COMPANY_INFO.md`). The
   only items published so far are the social accounts and the business listing you supplied (section 3).

## 1. Coolant showcase phase 2 — what was built

| Approved decision | Implementation |
|---|---|
| **Option B** on desktop and tablet landscape: the fan glides ~18% left, information appears in a right column, and the exact position is restored on return | A screen-space camera view offset, eased in the existing per-frame update. Arrangement, angles, scale, colours and lighting are untouched. The shift is computed per selection so the pulled-forward pack never leaves the frame or touches the left edge. Measured shifts at 1440 px are 12.5% (Organic, the widest pulled pose) and 18% (Inorganic, Eutectic); at 1180 px, 9.2–15.8%; at 1920 px, 14.9–18%. Returning eases back to exactly 0 px. These were measured with a debug build during implementation. The shift code has not changed since, and on the final build, picks aimed at the moved pack positions land on the right packs. |
| Information only after all three packs have landed | Information is gated at `s ≥ 1.46`. The family headline fades in over `s` 1.46 → 1.66. A selection made during the deal waits for the fan. |
| Scrolling back above the completed fan restores the family view | Scrolling back past `s = 1.40` with a coolant selected deselects it, so the reversed deal always replays from the family view. |
| About half a screen of extra reading time | `PINNED_SPAN` 2.4 → 2.9. Only the section length changed. |
| Smooth forward and reverse scrolling; next section not obstructed | Verified in the scroll-behaviour, clickability and continuous-scroll checks in section 5. |
| Family headline | **"Three coolant variants. One INFINOS coolant family."** (owner correction; it replaces "One pack design.", because the Eutectic moulding is unconfirmed, Q4). With the kicker "INFINOS coolants" and the hint "Select a coolant" above the selector. It fits at eight sizes (section 5). |
| Selected name prominent; verified information only; hairline dividers; understated "Request specifications" link to Contact | `CoolantInfo` shows "← All coolants", the variant kicker with a colour swatch, the name in display type, the family line, the verified rows (hairline dividers) and "Request specifications →". No cards, boxes, icons or gradients. |
| Mobile: a compact sheet that never covers the selected pack | Portrait phones and tablets: the name sits in the band above the fan and the body in the band below it. Landscape phones: a left column while the fan stays at the right. All positions come from the fan's measured screen bounds (`--cx-fan-*`), so nothing overlaps a pack. |
| No-WebGL: the image follows the selection | Four transparent stills rendered from the real scene (family plus one per variant, 28–35 KB each). The still swaps with the selection and shifts like the 3D fan in the column layout. |
| Unresolved questions kept out of public content (Inorganic vs "chemical", 450 ml, PCM, Eutectic moulding) | `src/content/coolants.ts` holds every field as `pending`, with the open question noted; pending fields are never rendered. A field appears only when it is `verified` and has a source, so no component changes are needed. |
| Return paths | "All coolants", Esc, clicking the selected pack or button again, and clicking empty space. |

**Not built from the proposal:** the hairline name labels anchored to each pack in the family view (proposal, Stage A,
desktop and tablet). The packs are named by the selector directly below the fan, in each pack's colour. When the fan
glides left for the information column, anchored labels would compete with that column. I can add them if you still
want them.

**Ready for real data.** To prepare for the verified fields you will supply, the layouts were checked with all nine
rows filled. The test injected dummy rows into the test page only; they are not part of the build. That check found a
defect, now fixed:

- In the column layout (desktop and tablet landscape) and the side layout (landscape phone), centring pushed "All
  coolants" and the name above the visible area, out of reach.
- Now the name always stays at the top of its column, and only the rows scroll beneath it. Scrolling rows fade out at
  the bottom edge.
- The rows take the mouse wheel from the page's smooth scrolling only while they actually overflow, so the page keeps
  its smooth scroll everywhere else.
- With today's content (no verified rows), the layout is pixel-identical to before the fix (0 differing pixels in the
  information area).

**One fix outside the section, needed for it:** layers meant to be hidden under the coolant stage (the bag stage and
the story overlay) still had 84 elements visible, because inline `visibility: visible` overrode the inherited
`hidden`. A descendant rule now hides them. Before the fix, a faint left scrim showed through behind the coolants.

## 2. Positioning correction

INFINOS is presented as **a smart cold-chain and temperature-controlled transportation technology company**.
Healthcare and diagnostics stay the area where today's products are developed. The company-level copy no longer reads
as healthcare-only, and nothing implies that the current products are validated for other industries.

| Where | Before | After |
|---|---|---|
| Page title | INFINOS — Smart Diagnostic Cold-Chain Technology | INFINOS — Smart Cold-Chain & Temperature-Controlled Transportation Technology |
| Meta description, Company section | "…develops smart cold-chain solutions designed to support … diagnostic samples and other temperature-sensitive healthcare materials." | "INFINOS is a smart cold-chain and temperature-controlled transportation technology company. It develops technology designed to keep temperature-sensitive products within their required conditions while they travel. Its current products are developed for healthcare and diagnostics: smart containers for the collection and transport of diagnostic samples." |
| Intro tagline, mobile menu, footer | Smart diagnostic cold-chain technology | Smart cold-chain technology (one line, the wordmark's width, on desktop and phone) |
| Positioning section | "Smart diagnostic cold-chain technology." | "Smart cold-chain technology." and a new **Industries** row (below) |
| Chapter 01 | "Smart diagnostic cold chain" / "The diagnostic cold chain, made smart." | "Smart cold chain" / "The cold chain, made smart." The body now says today's products are designed for diagnostic samples. |
| Pillar III (positioning section, story progress label, Impact kicker, chapter 08) | Healthcare impact | Social & environmental impact (the pitch deck's own heading, p.04) |
| Technology section | "Built for the diagnostic cold chain." | "Built for the cold chain." The lede scopes the three layers to "today's INFINOS products, developed for diagnostic sample transport". |
| Applications, Impact | Diagnostic framing as if it were the whole company | The same diagnostic applications and aims, introduced as today's products |
| Company section | Company · Focus · Web | Company · Focus (smart cold-chain and temperature-controlled transportation technology) · **Current products** (diagnostic sample transportation) · Web |
| Contact | "Diagnostic laboratories, hospitals and collection networks: …" | "Healthcare and diagnostics teams, and businesses that move temperature-sensitive products: get in touch about pilots, deployment and new applications." |

**The industries row** (`INDUSTRIES` in `src/content/platform.ts`) states the scope of each industry:

- Healthcare & diagnostics — **Current products**
- Pharmaceuticals; Food & beverages; Perishable goods; Specialised logistics (other temperature-sensitive products) —
  **Potential application**

A note follows: "Current INFINOS products are developed for diagnostic sample transportation. The other industries are
potential applications of INFINOS technology; the current products have not been validated for them." An industry
moves to "current" only with your confirmation.

**Company positioning and coolant information stay separate.** The company-wide positioning lives in
`src/content/platform.ts` (`POSITIONING`, `INDUSTRIES`), `site.ts` and `company.ts`. Coolant-specific information
lives only in `src/content/coolants.ts`. The coolant showcase makes no company-level claims, and the positioning copy
makes no coolant claims.

One overlap to be aware of: the product sections keep the pitch deck's coolant wording from the earlier accuracy pass.
- Technology section and chapter 03: "a pre-filled 450 ml bottle of organic or chemical PCM coolant".
- Impact section: "reusable organic or chemical PCM coolant".
- Chapter 06: "reusable PCM coolant".

That wording describes the bag's coolant as the deck does, and it is what open questions Q1–Q3 ask about. I left it
unchanged because you asked for no further changes. It can be held back until Q1–Q3 are answered.

**Unchanged on purpose:** product-level facts. The containers are designed for diagnostic samples; the zones and
sample categories; the embroidered side-panel text; the range. These describe the product that exists today.

## 3. Company identity (groundwork; no migrated information published)

- **`src/content/company.ts`** is now the one place for the legal name, emails, website and, once approved, phone
  numbers, addresses and social links. The footer, the Company section and the Contact section read from it, so no
  component hardcodes contact details.
- **The LLP designation appears nowhere** on the new site: 0 matches in the built HTML and JavaScript, and 0 in
  `public/`.
- The legal name shown, "InfinosTech Pvt. Ltd.", comes from the pitch deck. **The exact registered name is waiting for
  your confirmation**; confirming it is a one-line change.
- The full previous-website inventory, the social URLs, people and organisations, outdated items, every LLP instance
  and the approval questions are in **`docs/MIGRATION_COMPANY_INFO.md`**.

### Official social accounts and business listing (owner-supplied, 2026-10-15)

| Link | Where it appears |
|---|---|
| Facebook `https://www.facebook.com/Infinos/` | Footer icon; Contact, under "Follow INFINOS" |
| Instagram `https://www.instagram.com/infinostech/` | Footer icon; Contact, under "Follow INFINOS" |
| X `https://x.com/Infinostech` | Footer icon; Contact, under "Follow INFINOS" (accessible name "X (formerly Twitter)") |
| Medium `https://medium.com/@infinostech` | Footer icon; Contact, under "Follow INFINOS" |
| Justdial (the full listing URL) | Contact only, under a separate "Business listing" heading, not among the social accounts |

- **One place for the URLs.** They are stored only in `src/content/company.ts` (`COMPANY.social`,
  `COMPANY.listings`). The footer and the Contact section render from those lists.
- **No other accounts.** LinkedIn and WhatsApp from the old site were not in your list, so they are not used.
- **Links.** Every link opens in a new tab with `rel="noopener noreferrer"`. Each has an accessible name that includes
  its visible label, e.g. "INFINOS on Facebook (opens in a new tab)".
- **Icons.** Monochrome SVG marks (`src/components/sections/SocialIcon.tsx`) take the text colour and turn to the
  accent colour on hover and focus.
- **Placement.** The Contact links follow the existing mono link style. The footer icons sit between the copyright and
  the tagline. Every link has a tap target at least 32 px high.
- **Layout.** No other part of the footer or Contact section changed, apart from vertically centring the footer row
  for the icons.
- **Checked.** Href, target, rel, size and an actual hit test at the centre of every link, at five sizes in Chrome and
  in WebKit desktop and phone (section 5).

## 4. Modified files

| File | Change |
|---|---|
| `src/content/coolants.ts` | Central coolant content: fields with verified/pending status, family copy, stills |
| `src/components/coolants/CoolantInfo.tsx` (new) | Family introduction and the selected coolant's information; rows that overflow scroll inside their column |
| `src/components/coolants/CoolantShowcase.tsx` | Mounts the information; frame-loop updater writes the focus and family state; Esc; auto-return; still swap |
| `src/components/coolants/CoolantCanvas.tsx` | Per-selection focus shift (view offset); fan bounds published as CSS variables |
| `src/components/coolants/coolantStore.ts` | `shown` keeps the last selection during the fade-out |
| `src/motion/coolantMotion.ts` | `INFO_FROM`, `familyAt`, `RETURN_BELOW`, `focusShift` per layout, `PINNED_SPAN` 2.9 |
| `src/app/globals.css` | Information layouts (column, bands, side), the covered-layer fix, the industries row, a 4-column company meta row, the social and listing links |
| `public/images/coolants-fan*.webp` | Transparent no-WebGL stills (family and three selections) |
| `src/content/company.ts` (new) | Company identity: legal name, emails, website, official social accounts, business listing |
| `src/components/sections/SocialIcon.tsx` (new) | Monochrome social marks |
| `src/content/platform.ts`, `site.ts`, `story.ts`, `products.ts` | Positioning copy, `INDUSTRIES`, pillar III, tagline |
| `src/components/sections/PlatformSections.tsx`, `src/app/layout.tsx`, `src/components/story/StoryOverlay.tsx` | Positioning copy, industries row, company meta, metadata from content; social and listing links in Contact and the footer |

## 5. Measurements and regression checks (exact build `TeG6vFmkFtJdpyXhzoNDv`, Chrome)

### How the measurements were taken

- **Two builds, same session.** Production builds of the baseline (`3WkaIuhv_RSyek4-YWzDi`, port 3300) and the final
  build (`TeG6vFmkFtJdpyXhzoNDv`, port 3200) were served side by side. Each scenario ran baseline then final, back to back, after the
  machine's load had settled.
- **Browser.** Chrome headless with the Metal GPU backend.
- **The journey.**
  1. Wait for the intro to finish (or not, in the "immediate" cases).
  2. Scroll continuously, in timed bursts of wheel events, through the bag story, the coolant section and on.
  3. Jump around inside the section ("seek").
  4. Sweep the mouse over the fan ("hover").
  5. Switch selections ("select").
- **What is recorded.** Every frame interval. At 60 Hz, "> 20 ms" means a frame came late and "> 34 ms" means at
  least one frame was dropped.

**What "frames" means.** The frame column only shows how long the test took to scroll through that part, which
depends on the test harness's own timing. It is not a quality measure. The late frames, dropped frames, p95 and
longest frame are what measure smoothness.

**Why "after" has more frames.** The section is half a screen longer by design (`PINNED_SPAN` 2.4 → 2.9).

#### Normal CPU, desktop 1440×900 at 2×

| Part of the journey | frames (base → final) | frames > 20 ms | frames > 34 ms | longest frame (ms) | p95 (ms) |
|---|---|---|---|---|---|
| story | 3319 → 3890 | 1 → 1 | 1 → 1 | 50 → 50 | 16.7 → 16.7 |
| coolant | 653 → 869 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.7 |
| after | 271 → 506 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |
| seek | 150 → 150 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.7 |
| hover | 481 → 473 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.7 |
| select | 192 → 191 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.8 |

Long animation frames (> 50 ms) over the whole run: 1 → 1. Shader compile stalls > 4 ms: 0 → 0. Console errors: none → none.

#### 4× slower CPU (simulated), desktop

| Part of the journey | frames (base → final) | frames > 20 ms | frames > 34 ms | longest frame (ms) | p95 (ms) |
|---|---|---|---|---|---|
| story | 2896 → 2882 | 1465 → 1491 | 62 → 80 | 67 → 83 | 33.4 → 33.4 |
| coolant | 815 → 726 | 45 → 53 | 1 → 5 | 50 → 133 | 33.2 → 33.3 |
| after | 329 → 488 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |
| seek | 150 → 150 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |
| hover | 474 → 471 | 1 → 0 | 0 → 0 | 33 → 17 | 16.7 → 16.7 |
| select | 194 → 193 | 0 → 3 | 0 → 2 | 17 → 50 | 16.8 → 16.7 |

Long animation frames (> 50 ms) over the whole run: 5 → 13. Shader compile stalls > 4 ms: 0 → 0. Console errors: none → none.

#### Phone emulation 390×844 at 3×

| Part of the journey | frames (base → final) | frames > 20 ms | frames > 34 ms | longest frame (ms) | p95 (ms) |
|---|---|---|---|---|---|
| story | 4436 → 5455 | 1 → 1 | 1 → 1 | 50 → 50 | 16.7 → 16.7 |
| coolant | 917 → 1226 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.8 |
| after | 374 → 692 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.8 |
| seek | 150 → 150 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.8 |
| hover | 479 → 480 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |
| select | 192 → 192 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.8 |

Long animation frames (> 50 ms) over the whole run: 1 → 0. Shader compile stalls > 4 ms: 0 → 0. Console errors: none → none.

#### Scrolling the moment the intro ends, desktop

| Part of the journey | frames (base → final) | frames > 20 ms | frames > 34 ms | longest frame (ms) | p95 (ms) |
|---|---|---|---|---|---|
| story | 3813 → 3822 | 3 → 2 | 1 → 2 | 133 → 50 | 16.7 → 16.8 |
| coolant | 869 → 868 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.8 |
| after | 348 → 514 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.7 |
| seek | 150 → 150 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.7 |
| hover | 478 → 470 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.8 |
| select | 192 → 192 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |

Long animation frames (> 50 ms) over the whole run: 1 → 1. Shader compile stalls > 4 ms: 0 → 0. Console errors: none → none.

#### Scrolling the moment the intro ends, 4× CPU

| Part of the journey | frames (base → final) | frames > 20 ms | frames > 34 ms | longest frame (ms) | p95 (ms) |
|---|---|---|---|---|---|
| story | 2880 → 2892 | 1516 → 1508 | 84 → 109 | 200 → 117 | 33.4 → 33.4 |
| coolant | 801 → 808 | 44 → 50 | 2 → 5 | 50 → 50 | 33.3 → 33.3 |
| after | 321 → 476 | 0 → 0 | 0 → 0 | 17 → 17 | 16.7 → 16.7 |
| seek | 150 → 150 | 0 → 0 | 0 → 0 | 17 → 17 | 16.8 → 16.7 |
| hover | 470 → 473 | 0 → 4 | 0 → 1 | 17 → 50 | 16.7 → 16.8 |
| select | 194 → 198 | 0 → 2 | 0 → 1 | 17 → 50 | 16.8 → 16.8 |

Long animation frames (> 50 ms) over the whole run: 10 → 14. Shader compile stalls > 4 ms: 0 → 0. Console errors: none → none.

**Notes on the numbers.**

- **Frame counts are not a quality measure.** In this batch the *baseline* recorded fewer frames in the normal-CPU
  desktop and phone runs: coolant 653 vs 869, and 917 vs 1226. In an earlier batch it was the final build. Frame
  quality matched in both: no frame over 34 ms in the coolant section, p95 16.7–16.8 ms.
- **4× CPU, slow frames in the coolant section.** This batch showed a few more slow frames there for the final build
  (desktop 1 → 5 over 34 ms, immediate 2 → 5). I re-ran both 4× pairs with full long-frame attribution.
  - Re-run results for the final build, coolant section: 0 frames over 34 ms (max 33 ms) in both desktop repeats and
    in two of three immediate repeats. Selection and hover peaked at 17 ms. The baseline gave 0 over 34 ms in all of
    its repeats.
  - The one other repeat started with a 780 ms frame that ran **no script**, inside the unchanged bag story
    (s ≈ −10), followed by a burst of slow frames. The Mac had just switched to battery power at that moment.
  - The final build's coolant section was clean again in the next repeat, which also had fewer slow story frames than
    the baseline (38 vs 61).
  - The new links are at the very end of the page, far below the coolant section.
- **Bag story at 4× CPU.** The "story" rows under 4× CPU cover the unchanged bag story and vary from run to run in
  both builds (late frames 1121–1652, dropped frames 25–236 across the batches).

### React and memory

| Check | Baseline | Final |
|---|---|---|
| React commits, 60 wheel steps inside the section | react-dom 1, 3D canvas 0 | react-dom 1, 3D canvas 0 |
| React commits, 12 selection switches | react-dom 13, 3D canvas 0 | react-dom 13, 3D canvas 0 |
| React commits, hover sweep (120 moves) | react-dom 15, 3D canvas 0 | react-dom 8, 3D canvas 0 |
| Repeated visits (5 reloads in one tab; heap after forced GC) | 22.5–22.8 MB, flat | 22.6–22.9 MB, flat |
| Coolant model request during a continuous scroll | — | Requested before the section is reached |

### Family headline fit (final build, family view at s = 2.0)

"Three coolant variants. One INFINOS coolant family." sits between the navigation and the top of the fan (or beside
the fan in the landscape-phone layout) at every size measured:

| Size | Layout | Lines | Result |
|---|---|---|---|
| 1920×1080, 1440×900, 1180×820 | column | 1 | clear of the navigation and the fan |
| 820×1180 | bands | 1 | clear |
| 390×844, 360×740 | bands | 2 | clear |
| 844×390 | side | 4 | clear, beside the fan |
| 1280×720 | column | 1 | headline clear. The kicker's line box starts 2 px inside the navigation bar's bottom edge, but the letters sit below the bar's hairline (screenshot). The previous one-line headline had the same geometry. |

Screenshots: `docs/screenshots/coolants-phase2/headline/`.

### Functional regression checks (final build, Chrome; no console errors in any of them)

| Area | Result |
|---|---|
| Coolant stages, at 1440×900, 1180×820, 820×1180, 390×844, 844×390 and 1920×1080 | Dealing → family headline → each coolant's information → switching → "All coolants" → Esc → auto-return when scrolling back above the fan → forward again: all as specified at every size. "Request specifications" is clickable and brings Contact into view. |
| Picking packs on the glided fan (desktop) | Organic, Inorganic and Eutectic each picked at their moved positions |
| Reduced motion; no WebGL (desktop and phone) | Same stages pass. Without WebGL, the still follows the selection: family, organic (shift −171 px), inorganic and eutectic (−259 px), then back to family with no shift. |
| Scroll behaviour, desktop and phone | A selection made during the deal opens once the fan lands. Wheeling back returns to the family. Wheeling on with a coolant open, the next section is never covered (0 covered points). |
| Rapid selection | 24 clicks mixed with scrolling end on the last click when scrolling stays in the open range. When the last scroll crosses back above the fan, the family view returns, as approved. That pre-Phase-2 test scrolls to random positions, so it shows either outcome; both were confirmed with fixed positions. |
| Clickability through the hand-over, desktop and phone | Navigation, the chapter-08 buttons, the selector, "All coolants" and "Request specifications" are clickable at every sampled position |
| Keyboard | Hover, Enter, Space and Tab selection, with matching colours |
| Cover and hand-over | Bag stage hidden under the fan and restored after the nav "Product" jump. The 360° viewer opens over the section and returns to s = 1.50. Five down/up passes leave 3 canvases. |
| Continuous scroll screenshots (desktop, phone, tablet portrait and landscape) | 15 frames each, no errors |
| Chapter fit (5 sizes) | Every chapter fits. Tightest: compartments at 423 of 472 px (tablet portrait); chapter 01 is 237 of 363 px on a phone. |
| 360° viewer | All four quadrants on desktop and mobile; scroll position restored |
| Resilience | Reduced motion and no-WebGL fallbacks work; the viewer explains why WebGL is needed |
| Intro (3 sizes) | Loader until 1.99 s, logo 2.00–3.99 s, product from 4.02 s; 0 overlap frames |
| Intro tagline | "Smart cold-chain technology" on one line, exactly the wordmark's width, on desktop and phone |
| Built page | 0 "LLP" mentions; title "INFINOS — Smart Cold-Chain & Temperature-Controlled Transportation Technology" |
| Future verified fields (nine dummy rows, test page only) | The name stays in view at every size and the rows scroll inside their column. The wheel scrolls the rows while they overflow, then the page continues. With today's content the wheel scrolls the page as before. |
| Social accounts and business listing (Contact and footer), at 1440×900, 1180×820, 820×1180, 390×844 and 844×390 | At every size, all 9 links (5 in Contact, 4 in the footer) have the supplied URL, `target="_blank"`, `rel="noopener noreferrer"` and an accessible name. All are at least 32 px high and clickable at their centre. The links were not followed during testing. |

## 6. WebKit (Safari's engine)

WebKit was tested with a small native harness: WKWebView on this Mac's system WebKit, the same engine as Safari. Clicks
on the 3D canvas are real mouse events sent through the window. **This is not the Safari app, and not iOS.** In this
harness WebKit runs at about 30 frames per second (idle requestAnimationFrame 31–32/s), the same as for the stabilised
build, so frame times are compared against 33 ms. All runs below are on the final build `TeG6vFmkFtJdpyXhzoNDv`.

| Check | Desktop 1440×900 | Mobile 390×844 (iPhone user agent) |
|---|---|---|
| Coolant section, continuous scroll | 99 frames, median 33 ms, max 36 ms, 0 over 50 ms (stabilised: max 35 ms, 0 over 50 ms) | 99 frames, median 33 ms, max 59 ms, 6 over 50 ms (stabilised: max 61 ms, 6 over 50 ms) |
| Rapid selection (24 clicks mixed with scrolling) | ends on the last click; max 36 ms | ends on the last click; max 36 ms |
| 3D pack picks (real clicks) | Each pick selects the right pack **and opens its information**; empty space closes it | Same |
| Buttons, "All coolants" return, clickability at 9 positions, nav jump, 360° viewer, 5 down/up passes | All pass | All pass |
| Social and listing links (9) | All have the right URL, new tab and `noopener noreferrer`; all clickable | Same |
| No WebGL | Bag fallback; the still swaps with the selection (organic −171 px, eutectic −259 px) and returns on "All coolants"; information opens | — |
| Console errors or warnings | none | none |

**Repeated visits (WebKit process memory after each visit's journey, 4 visits, same session):**

| Build | Visit 1 | Visit 2 | Visit 3 | Visit 4 |
|---|---|---|---|---|
| Baseline (same environment) | 265 MB | 337 MB | 382 MB | 390 MB |
| Final build | 214 MB | 271 MB | 322 MB | 328 MB |

WebKit's process memory includes caches and is reclaimed lazily, so it varies from run to run. The baseline climbs the
same way, and the final build is not higher than the baseline. The forced-GC JavaScript heap measured in Chrome stays
flat.

**Pre-existing WebKit behaviour, unchanged:**

- A first-compile stall when the bag is first revealed, at about 4.8 s: 802 ms on desktop (947 ms with the stabilised
  build) and 600 ms on mobile.
- The other frames over 100 ms that the harness lists around s ≈ −0.6 to 0.2 are its own screenshot pauses. They occur
  at the same positions with the stabilised build.

Screenshots: `docs/screenshots/coolants-phase2/webkit/`.

## 7. Limitations and tests not performed

- **No real devices.** "Phone" means Chrome's device emulation (390×844 at 3×, touch, mobile viewport) and a
  WKWebView window of the same size. Neither is a real phone.
- **The Safari app itself was not tested.** WebKit was tested through a WKWebView harness on this Mac's system WebKit.
  Enabling Safari's automation would mean changing Safari settings, which I left alone. I do not claim Safari or iOS
  compatibility beyond what section 6 measured.
- **4× CPU is simulated** with DevTools throttling; the GPU is not throttled.
- **No technical coolant information is published**, because none is verified yet. The layouts for future fields were
  checked with nine dummy rows injected into the test page only (section 1, `future-rows/` screenshots).
- **The company migration** waits for your approval.

## 8. Screenshots

- `docs/screenshots/coolants-phase2/`:
  - `stages/`: family, focus and switching at six sizes
  - `flow/`: scroll behaviour, desktop and phone
  - `fallbacks/`: reduced motion and no-WebGL
  - `future-rows/`: all nine fields filled with dummy text (test page only), at five sizes
  - `headline/`: the family headline at eight sizes
  - `webkit/`: WebKit family view, selections, no-WebGL and the 360° viewer
  - `continuous/` and `regression/`: chapters, sections, the hand-over, intro
- `docs/screenshots/positioning/`: all supporting sections at desktop, tablet portrait and phone; the intro tagline
- `docs/screenshots/social/`: the Contact section with the social and listing links, and the footer, at five sizes
  (Chrome) and at desktop and phone size (WebKit)
