# Proposal: "INFINOS in Action" gallery and "Our Ecosystem" section

Audit and proposal only. **No website files have been changed.** Implementation starts after your approval. The
Phase 2 ZIP (`infinos-website-coolants-phase2.zip`, build `TeG6vFmkFtJdpyXhzoNDv`) stays untouched as the rollback
baseline.

## 1. Audit

### Uploaded assets

| # | File | Size | What it shows | Use |
|---|---|---|---|---|
| 1 | `1.jpg` | 1080×603 (≈16:9) | Group photograph of 14 people in front of a large painted mural. The mural lettering is partly hidden ("…H FOUNDATION"). | Gallery |
| 2 | `2.jpg` | 1080×811 (4:3) | Five people in front of a **Cargomen Logistics (India) Pvt. Ltd.** backdrop, two holding INFINOS temperature-controlled bags (the red dual-chamber bag and a black one) | Gallery |
| 3 | `3.jpg` | 1080×806 (4:3) | Meeting around a table; the screen reads **"SMART CITY LIVING LAB"** | Gallery |
| 4 | `4.jpg` | 1080×807 (4:3) | Conference room; a presenter stands beside the red INFINOS bag (biohazard symbol) with seated visitors | Gallery |
| 5 | `5.jpg` | 1600×808 | Screenshot of the old site: contact, social icons, footer logos (Startup India, the LLP-era INFINOS mark, Amrita TBI, Agnii, DPIIT) | Logo source |
| 6 | `6.jpg` | 1600×1086 | Screenshot of the old site: International Collaborations (Astromerge, Lunar Mission One, WH+, HelioX Cosmos) and the old gallery | Logo source |
| 7 | `7.jpg` | 1600×1122 | Screenshot of the old site: Our Team and Endorsements | Not used (team and endorsements are separate open items in the migration list) |

- **Photos 1, 3 and 4 appear to be from the same visit**: the same visitors in dark suits appear in all three. I won't
  name the visit or its location without your confirmation.
- **Photo resolution.** At 1080 px wide, the photos stay sharp on high-density screens up to about 540 CSS px wide
  for 4:3, which sets the gallery's height (section 2).
- **Missing: the VentureRISE certificate is not among the uploaded files.** The recognition highlight (section 3)
  needs it.

### Logo sources

| Logo | Crop from the screenshot | Original file on the old site (not downloaded yet) |
|---|---|---|
| Startup India | 240×70, includes the caption and a dark band | `img-1/f-2.png`, 656×146, 16 KB |
| Amrita TBI | 180×55 | `img-1/f-3.jpg`, 350×99, 43 KB |
| Agnii | 150×125 | `img-1/f-4.jpg`, 180×147, 4 KB (no larger than the crop) |
| DPIIT | 234×120 | `img-1/dipp1.png`, 283×142, 23 KB (see the warning in section 4) |
| Astromerge | 240×55 | `img-1/hw-Asset-1@2x.png`, 1319×254, 15 KB |
| Lunar Mission One | 243×162 | `img-1/LUNAR.png`, 320×320, 11 KB |
| WH+ | 220×75 | `img-1/worldOrg.png`, 320×320, 13 KB |
| HelioX Cosmos | 248×125 | `img-1/HeliloX.jpg`, 320×320, 15 KB |

The screenshot crops are soft at the planned logo size on high-density screens. The originals are sharper for seven of
the eight. **I'd like your permission to download those eight files (about 140 KB in total) from
`https://www.infinostech.com/img-1/`.** If you have official logo files (SVG, or PNG with transparency) from any of
these organisations, those would be better still.

### Architecture

- **No reusable carousel or marquee** exists in the project, and none of its dependencies provides one.
- **Animation must not ride the shared frame loop.** `src/motion/frameLoop.ts` runs every renderer whenever any one
  of them asks for another frame. A continuously moving marquee would keep the bag, coolant and overlay renderers
  waking every frame.
- **So the marquees get their own small tick on GSAP's ticker** (the same requestAnimationFrame as Lenis, so no second
  loop). The tick is attached only while the section is on screen (IntersectionObserver) and detached otherwise. No
  React state changes per frame, and no WebGL.
- **Images.** The project serves pre-encoded images with explicit sizes (e.g. `range-pro.webp`), and `sharp` is
  already installed. Gallery photos will be encoded the same way: WebP at two widths, with `srcset`/`sizes`,
  `width`/`height` (no layout shift), `loading="lazy"` and `decoding="async"`.
- **Reduced motion and Lenis.** `prefersReducedMotion()` already exists in `src/hooks/environment.ts`. Lenis runs
  vertically only. The marquees use pointer events with `touch-action: pan-y`, so vertical page scrolling and the
  story's ScrollTrigger are unaffected.

## 2. Placement

Current page order (unchanged parts in plain text):

```
Intro → bag story (8 chapters, MOVE) → coolant showcase → Positioning → Applications → Technology → Impact → Range
  → [NEW] INFINOS in Action
  → Company
  → [NEW] Our Ecosystem (with the recognition highlight)
  → Contact (with footer)
```

- **INFINOS in Action** follows the product range: real demonstrations after the products.
- **Our Ecosystem** sits between Company and Contact, as part of "who INFINOS is".
- **Navigation stays unchanged.** Adding nav items would change the existing navigation.

## 3. Section layouts

### A. INFINOS in Action (gallery)

- **Head.** In the existing section style: the kicker "Gallery", the title "INFINOS in action.", and a one-line lede:
  "Product demonstrations, discussions and visits."
- **Track.** Full-bleed, wider than the text column, with a very soft fade at the left and right screen edges.
  - Every photo has the same height: 420 px on desktop, 340 px on tablet, 250 px on phone.
  - Widths follow each photo's own ratio (4:3 or 16:9), never cropped or stretched.
  - 20 px gaps.
  - Barely rounded corners; no borders, shadows or glow.
- **Order.** Photo 2 → photo 4 → photo 3 → photo 1, so the wide group photo closes the sequence.
- **Captions.** Small mono captions under a photo, only where the context is known:

  | Photo | Proposed caption | Basis |
  |---|---|---|
  | 2 | "Product demonstration · Cargomen Logistics" | Backdrop, and your description |
  | 4 | "Product presentation" | The INFINOS bag is on the table |
  | 3 | "Smart City Living Lab" | Shown on the screen in the photo |
  | 1 | (none until you provide the event) | — |

- **Motion.** A slow, continuous drift to the left: about 22 px/s on desktop, about 16 px/s on phone.
  - The loop is seamless: the set is repeated as many times as the screen width needs, and the position wraps.
    Repeats are hidden from screen readers and keyboard focus.
- **Interaction.**
  - Hovering, keyboard focus, or pressing on the track pauses it smoothly. It resumes about 1.5 s after the
    interaction ends.
  - Drag with mouse or touch (with gentle inertia); a horizontal trackpad swipe also moves it.
  - Two small hairline arrow buttons step one photo at a time.
- **Hover.** The photo brightens slightly and its caption takes the accent colour. No scaling.
- **Reduced motion.** No drift. The track becomes a normal horizontal scroll row with snap points and the same arrow
  buttons.

### B. Our Ecosystem

- **Head.** The kicker "Ecosystem", the title "Our Ecosystem.", and the lede: "Programmes, institutions and
  organisations connected with INFINOS — each shown with its relationship."
- **Recognition highlight** (above the logos), in a restrained two-column row (stacked on phones):
  - A small label: "Recognition".
  - The text: "Selected among the **Top 16 startups**, VentureRISE Global Startup Challenge 2024/25, **ESDM
    category**." It reproduces the certificate's wording, with no "winner" or "award" language.
  - A small certificate thumbnail and a "View certificate" text button. Both open the certificate at full size in a
    native dialog (Esc, close button, click outside).
  - This needs the certificate file.
- **Logo marquee.** A second, independent full-bleed row that moves at about half the gallery's speed (about
  12 px/s).
  - **Plates.** Every logo sits on an identical plate: 200×112 px on desktop, 150×84 px on phone, a muted off-white
    (not bright white), no border or shadow, slightly rounded.
  - **Logos.** Each is centred with `object-fit: contain` inside the same padded box, so nothing is stretched or
    cropped. Logos supplied on a white background blend into the plate instead of showing a second rectangle. Logos
    whose artwork includes its own dark box (Lunar Mission One, Amrita TBI) keep it.
  - **Labels.** A small mono relationship label sits under each plate (section 4).
  - **Interaction.** Pause on hover and focus, drag and touch.
  - **Reduced motion.** A static, centred, wrapped grid instead of the marquee.
- **Foot note** (faint, mono): "Relationships as listed on the previous INFINOS website unless marked otherwise;
  earlier collaborations are not presented as current partnerships."

The two sections share the site's typography, spacing and dark palette. The gallery is photo-led and full-height. The
ecosystem section is quieter and smaller, with light plates, so the two read as distinct.

## 4. Logo mapping and relationship labels (defaults; please confirm)

| Logo | Label under the logo | Basis | Needs your confirmation |
|---|---|---|---|
| Startup India | "Startup India · registered" | Old site: "We're registered under Start Up India Hub" | Is the registration valid for the Private Limited company? |
| DPIIT | "DPIIT-recognised startup", **as a text plate, not the logo** | Old site: "DIPP Recognised" | The logo contains the **State Emblem of India**, whose use is restricted by law. I recommend not showing it. Does the recognition apply to the Private Limited company (certificate number)? |
| Amrita TBI | "Institutional support · NIDHI PRAYAS" | Old site: "Supported by Amrita TBI NIDHI PRAYAS" (the logo itself says "Funded by") | "Supported" or "funded"? Current or past? Year? |
| Agnii | "Featured" | Old site: "We're featured under Agnii" | Year, if wanted |
| Astromerge | "Earlier collaboration" | Old site, "International Collaborations" (undated) | Current or past? |
| Lunar Mission One | "Earlier collaboration" | as above | as above |
| WH+ | "Earlier collaboration" | as above; the organisation's full name isn't on the site | **What is WH+?** (needed for the alt text) |
| HelioX Cosmos | "Earlier collaboration" | as above | as above |
| VentureRISE | Recognition highlight, not in the marquee | Certificate | Please upload the certificate |

**Not included:**
- the LLP-era INFINOS mark;
- Cargomen as a partner logo (it appears only as a gallery caption, and only as a meeting place, unless you confirm a
  partnership);
- the old gallery photos (2017-era, low resolution, a press clipping, unidentified people). I can add them as
  "Earlier moments" if you want.

## 5. Implementation plan (after approval)

| File | Change |
|---|---|
| `src/content/gallery.ts` (new) | Photos: file, size, alt text, optional caption, order |
| `src/content/ecosystem.ts` (new) | Logos: file, size, name, relationship label, status (`current` / `earlier` / `unconfirmed`); the recognition text and certificate |
| `src/components/sections/Marquee.tsx` (new) | One reusable seamless marquee: drift speed, pause on hover/focus/press, drag and inertia, arrow steps, reduced-motion fallback. DOM transforms only; ticks only while visible |
| `src/components/sections/GallerySection.tsx`, `EcosystemSection.tsx` (new) | The two sections and the certificate dialog |
| `src/components/Experience.tsx` | Inserts the two sections (no other change) |
| `src/app/globals.css` | Styles for the two sections |
| `public/images/gallery/`, `public/images/ecosystem/` | Encoded photos (WebP at 560 and 1080 px wide); logos at 2× plate size |
| `tools/encode_gallery.mjs` (new) | Re-runnable encoding with `sharp` |

**Not touched:** the intro, the bag model and story, MOVE, the coolant showcase, the 360° viewer, navigation and
typography.

**Tests**, run on the exact packaged build:
- the full existing regression and performance suite against the Phase 2 build;
- new checks:
  - the loop is seamless (no position jump at the wrap);
  - pause on hover and focus, resume afterwards;
  - drag, touch and arrow steps;
  - reduced motion;
  - the marquee ticks **zero** times while off screen (so the story and coolant performance are untouched);
  - no React commits during motion;
  - no layout shift while images load;
  - no horizontal page overflow at every size;
  - the certificate dialog opens and closes with mouse and keyboard;
  - WebKit desktop and phone.

Deliverables: the list of images and logos used, screenshots at desktop and mobile sizes, a test report and a new ZIP.

## 6. Questions before I start

1. **VentureRISE certificate.** Please upload it (image or PDF). It also names the company "INFINOSTECH PVT. LTD.",
   which helps answer the open legal-name question.
2. **Logo originals.** May I download the eight original logo files from `infinostech.com/img-1/` (about 140 KB)? If
   not, I'll use the screenshot crops.
3. **DPIIT.** Agree to a text plate instead of the emblem logo? Does the recognition apply to the Private Limited
   company?
4. **Relationship labels.** Are the defaults in section 4 right? In particular, are any of the four international
   collaborations current?
5. **WH+.** What is the organisation's name?
6. **Captions.** Are the proposed captions correct? What is the visit in photos 1, 3 and 4? Name it only if you want
   it named.
7. **People in the photos.** Please confirm you have the permission of the people shown, including visitors, to
   publish these photos.
8. **Placement.** Is the proposed placement (gallery after Range, ecosystem before Contact) right, with navigation
   unchanged?
