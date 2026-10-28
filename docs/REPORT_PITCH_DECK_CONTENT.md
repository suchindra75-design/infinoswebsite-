# INFINOS TECH: website content from the official pitch deck

**Source:** *DiagnoSmart – 10 lakhs ALEAP Pitch deck* (InfinosTech Pvt. Ltd., 14 pages). The deck is mostly images, so every page was rendered and read visually.

**Page references:** the deck's printed slide numbers.

| Slide | Content |
|---|---|
| p.01 | Critical gap |
| p.02 | Market |
| p.03 | Solution |
| p.04 | Impact |
| p.05 | Competitive advantages |
| p.06 | Revenue |
| p.07 | Roadmap |
| p.08 | Product types & SKUs |
| p.09 | Pilots |
| p.10 | Traction and "The Ask" |

The unnumbered first slide is cited as "title slide".

**Single source of truth:** `src/content/platform.ts`. It holds every product fact with its slide number and a **status** (available / designed / inDevelopment / example / reported / projected). The site's wording and qualifier tags are generated from that status. Once a feature's implementation is confirmed, change its status in one place and the site's wording updates everywhere.

Everything below was verified on the **production build**:
- all 8 chapters on 5 layouts, all within their text space;
- all supporting sections;
- the 360° viewer (24/24 on desktop and mobile);
- reduced motion and no-WebGL;
- the intro;
- scroll performance (desktop: 1 dropped frame in 2,396; phone: 0 in 3,348; no long tasks);
- no console errors.

> **Correction (2026-10-13):** the 24-point viewer checklist (`viewer.mjs`) uses development-only test hooks, so it ran on the **development server**, not the production build. A command-line bug also made the run labelled "mobile" a desktop run. It has now been re-run correctly on the development server: **24/24 desktop and 24/24 mobile**. On the production build, the viewer was verified with `viewer_prod.mjs` (full 360° rotation, all four quadrants, scroll position restored, desktop and mobile) and the reduced-motion and no-WebGL checks.


---

> **Later refinement:** the positioning refinement (`REPORT_POSITIONING_REFINEMENT.md`) groups the chapters into three acts and swaps chapters 05 and 07. *Smart monitoring & data logging* is now 05 and *Safety & sample integrity* is now 07. The claims and their sources below are unchanged.

## 1. Positioning (what changed)

| Before | Now |
|---|---|
| "INFINOS T-1", "temperature-controlled transport, carried", a carried bag | **INFINOS Smart Diagnostic Sample Container**: a smart, dual-temperature-zone, AIoT-enabled portable container for diagnostic laboratory sample collection and transport (title slide, p.03) |
| — | The physical product in the 3D story and the 360° view is named **INFINOS Pro Dual-Chamber Bag** (p.08 "Physical implementation") |
| — | Monitoring is called **AIoT-enabled multi-zone monitoring** (p.08 title) |
| Tagline "Intelligent temperature-controlled transport" | **"Smart diagnostic sample cold chain"**: intro tagline, mobile menu, footer |
| Page title and description about thermal transport with "cooling and heating" | Title "INFINOS Tech — Smart Diagnostic Sample Container"; description from the title slide. No heating claim. |

"World's first" (title slide) is **not** used, because it is unverifiable.

## 2. The eight chapters (content changed)

The chapter order follows the existing camera choreography, so each idea appears with the matching view of the real product.

| # | Chapter | Product view | What it says | Visual support |
|---|---|---|---|---|
| 01 | Smart Diagnostic Container | Reveal + interactive hero | "Two temperature zones. One carried container." Portable, AIoT-enabled, homes ↔ labs ↔ hospitals (title slide, p.08). "Shown: INFINOS Pro Dual-Chamber Bag" | Explore markers (texts updated) |
| 02 | Dual-temperature architecture | Exterior pass → side view of the two stacked chambers | "Two zones, held apart." Blood, urine, stool at their own temperatures (p.03, p.08) | **Zone brackets** drawn along the real chambers: Zone 1 ≈ 2–8 °C (upper), Zone 2 e.g. −10 °C (lower). Note: −10 °C is an example. |
| 03 | Precision cooling & PCM | Flap and inner lid lift | "Cold, prepared in advance." Pre-filled 450 ml bottle, organic or chemical PCM, "precise temperature maintenance" (p.05, p.08) | Coolant graphic, tagged **"Formulation in refinement"** (p.10). Note: cooling duration and method being validated. |
| 04 | Intelligent compartments | Front panel drops, inner box slides out | "A place for every sample." Sub-compartments, simultaneous multi-temperature storage, sensorised to the requirement (p.05, p.08) | Compartment diagram (zones + configurable sensor points); callouts Zone 1, Zone 2, removable inner box |
| 05 | Safety & sample integrity | Box lid opens: lining and rack | "Built for sample integrity." **Designed with** UV sanitisation and tamper-proof sealing, plus integrity verification and chain of custody through the app (p.03) | Feature list. Integrity verification and chain of custody tagged **In development**. Note: features vary by configuration. |
| 06 | Sustainable cold chain | Top-down interior, bag starts closing | "Reusable cold. Less waste." Organic coolant options replace single-use ice packs (p.03, p.04) | Ice pack → reusable PCM graphic; **~500 t/yr, "Projected at scale"** (p.04) |
| 07 | Smart monitoring & data logging | Side display close-up | "Every zone, on record." Sensors and data logging; the INFINOS app **now in development** brings AIoT monitoring and automated alerts (p.03, p.08, p.10) | **Illustrative** monitoring panel (zone ranges, alerts, data log, chain of custody), tagged "Illustrative · in development"; callout: on-board display |
| 08 | The complete INFINOS system | Labelled exploded overview | "From doorstep to laboratory." Dual-zone container, PCM cooling and AIoT monitoring as one system | CTAs: Explore in 360° · Product range · Contact |

Other changes in the story:
- **Exploded-view labels:** "Upper chamber · Zone 1", "Lower chamber · Zone 2", "On-board display", "Sample rack".
- **Hero explore markers:** reference the zones; claims are limited to what the photographs show.

**No hardware was added to the product model.** Coolant, sensors, the app and safety features appear only as information graphics or text, as you asked. The existing OLED display is part of the original photo-validated model.

## 3. Supporting sections (content added)

| Section | Content |
|---|---|
| **Technology** (new) | Four pillars: (01) dual-zone temperature management with a compartment diagram; (02) PCM cooling approach with the coolant graphic and "6+ h, cooling, volume-dependent", tagged *Reported · validation pending*; (03) AIoT monitoring architecture as a Sense → Log → Monitor → Act chain, with the app and the integrity/custody steps tagged *In development*; (04) sensorised compartments & data logging with the illustrative monitoring panel. |
| **Product range** (new) | **INFINOS Pro Dual-Chamber Bag** (physical implementation; real render): two chambers and zones, sub-compartments, 450 ml PCM, external sensors and logging. **Smart Diagnostics Flexible Container** (product family; illustration). **Sensorial Smart Container** (with data logging; illustration). |
| **Applications** (rewritten) | Home collection → in transit (monitored) → laboratory/hospital. Five applications: diagnostic laboratories, hospitals, home sample collection, pathology sample transport, remote & underserved regions. Footnote: other multi-use configurations described in the deck (vaccines and pharmaceuticals, food, milk; p.03, p.05). |
| **Sustainability & impact** (new) | Alternative to single-use ice packs. Less plastic waste (~500 t/yr, *projected at scale*). Better sample integrity (up to 35% less degradation, *reported · validation pending*). Healthcare access. UN SDGs 3, 9 and 12 with their official titles. Footnote: figures come from INFINOS planning material and are not independently validated. |
| **Company** (rewritten) | InfinosTech Pvt. Ltd., its focus and website. The old "[PLACEHOLDER]" founding and HQ lines were removed. |
| **Contact** (rewritten) | www.infinostech.com. No email is published until you confirm which address to use. |

**Navigation:** Product · Technology · Range · Applications · Impact · Contact · 360° View.

Unused legacy data was removed from `products.ts`: heating, telemetry, placeholder applications and specifications. These had contradicted the deck.

## 4. Statement cross-check (site wording → deck)

| Site statement | Deck source | Status on the site |
|---|---|---|
| Smart, dual-temperature-zone, AIoT-enabled portable container for diagnostic lab sample collection and transport | title slide | stated |
| Zone 1 ≈ 2–8 °C | p.08 (e.g. 2–8 °C), p.03 (maintains 2–8 °C) | designed |
| Zone 2 e.g. −10 °C | p.08 "(e.g., −10 °C)" | example configuration |
| Upper chamber = Zone 1, lower = Zone 2 | p.08 diagram leader lines | interpretation: **confirm** |
| Blood, urine and stool samples | p.03 | stated |
| Simultaneous multi-temperature storage, distinct sub-compartments | p.08 | stated |
| Pre-filled 450 ml coolant bottle, organic or chemical PCM, precise temperature maintenance | p.08, p.05 | designed; formulation "in refinement" (p.10) |
| 6+ h cooling, volume-dependent | p.05 | reported, validation pending (Technology section only) |
| Sensorised compartments, customisable | p.05, p.08 | designed |
| External sensors and data logging on the physical bag | p.08 | designed |
| AIoT / app-based real-time monitoring, automated alerts, integrity verification, chain of custody | p.03, p.08; p.10 says the AIoT app is in MVP development | in development |
| UV sanitisation, tamper-proof sealing | p.03 | designed ("designed with") |
| Organic coolants replace single-use ice packs | p.03, p.04 | stated |
| ~500 t plastic waste reduction per year | p.04 "at scale" | projected at scale |
| Up to 35% less sample degradation | p.04 | reported, validation pending |
| Remote and underserved regions; SDGs 3, 9, 12 | p.04 | stated |
| Home → laboratory/hospital collection | p.08 "Pick & Transport" | stated |
| Pathology sample transport | p.02 (pathology networks), p.07 (pathology centres) | stated |
| Vaccines/pharma, food, milk (footnote) | p.05 use case, p.03 beachhead segments | footnote only |
| Product range names | p.08 | stated (relationship: **confirm**) |
| Dual chambers, removable inner box, reflective lining, rack, OLED, biohazard marking | the 13 product photographs | available |

## 5. Claims requiring confirmation before stronger wording

1. **Cooling principle (the most important).**
   - p.03 says "Maintains 2–8 °C … with active regulation"; p.05 says "Power: Non-electrical (PCM-based)" and "Cooling: 6+ hours (volume-dependent)".
   - These are **not combined** on the site. It says only "PCM coolant integration … for precise temperature maintenance", and shows 6+ h as reported.
   - **Please confirm:** is there any active (powered) regulation? Which configuration does 6+ h apply to, with what payload and ambient conditions?
2. **Zones.**
   - Is Zone 1 the upper chamber and Zone 2 the lower, as the p.08 diagram suggests?
   - Can −10 °C (example) and 2–8 °C be held at the same time with the 450 ml coolant? For how long?
3. **35% figure.** p.03 says "reduces **contamination** rates by up to 35%"; p.04 says "reduces sample **degradation** by 35%". These are different measures. Which is it, and what study or pilot data supports it? The site uses "up to 35% less sample degradation, reported".
4. **~500 t/yr plastic reduction.** What are the assumptions (units in service, ice packs replaced per unit, timeframe)?
5. **Implementation status.**
   - The deck's own MVP plan (p.10) lists "developing the core features of the AIoT application" and "refining coolant formulation".
   - For each of these, please confirm whether it is implemented today: UV sanitisation, tamper-proof sealing, integrity verification, automated alerts, chain-of-custody tracking, app-based monitoring.
   - The title-slide photo shows a "UV ON" indicator on the inner lid, so UV may already exist on the prototype.
   - Once confirmed, set `status: 'available'` in `platform.ts`.
6. **App and connectivity.**
   - The deck mentions a "mobile app" (p.03) and an "AIoT web app, SIM-free" (p.05); the photographed display shows a Wi-Fi status line.
   - No platform, protocol, battery or accuracy claims are published ("high accuracy", p.05, has no figure).
   - "The INFINOS app" is used as a working name: **confirm**.
7. **Sensor types.** Not specified in the deck (only "customizable per req"). None are named on the site.
8. **Product range naming.** p.08 titles the family "Smart Diagnostics Flexible Container …", calls the Pro bag the physical implementation, and captions item 1 "Sensorial Smart Container (with data logging)". Are these three distinct products, or is item 1 the Flexible Container itself? Their differences beyond the deck's captions are unknown.
9. **Regulatory.** No certifications or approvals are claimed. The roadmap (p.07) mentions "regulatory clearance" as a future milestone.
10. **Not published (your call):**
    - pilots and demos at named hospitals and labs (p.09);
    - letters of interest and the purchase order (p.10);
    - the solar-panel prototype (p.03 photo);
    - drone transport photos (p.09);
    - market and revenue figures (p.02, p.06, p.10);
    - team (p.11).
    Naming partner organisations would need their consent.
11. **Contact.** The deck lists a named founder's email. Which address should be published? Is there an HQ address?

## 6. Files

| Type | Files |
|---|---|
| New | `src/content/platform.ts`; `src/components/story/Figures.tsx`; `src/components/sections/PlatformSections.tsx` (Technology, Range, Applications, Impact, Company, Contact); `public/images/range-pro.webp` (cropped from an existing render) |
| Rewritten | `src/content/story.ts` (8 chapters, zone marks, figures) |
| Updated | `src/motion/chapters.ts` (chapter ranges); `src/components/story/StoryOverlay.tsx` (figures, zone brackets, CTAs); `src/content/site.ts` (navigation, tagline, contact); `src/content/products.ts` (names, labels, legacy data removed); `src/content/hotspots.ts`; viewer and loader naming; `src/app/layout.tsx` (metadata); `globals.css` |
| Removed | the old `ApplicationsSection`, `CompanySection`, `ContactSection` and `Eyebrow` components |
| Unchanged | v0.3 GLB, both image sequences, camera track, composition, frame loop and performance work, 360° viewer, intro |
| Screenshots | `docs/screenshots/pitch-deck/`: every chapter on 5 layouts, contact sheets, all supporting sections on desktop, tablet and phone |
