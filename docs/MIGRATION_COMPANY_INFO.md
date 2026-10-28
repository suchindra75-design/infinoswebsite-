# Company-information migration — previous website (inventory for approval)

Prepared 2026-10-14 from the previous website, `https://www.infinostech.com/`.

**Status (updated 2026-10-16):** published so far:
- the registered company name, INFINOSTECH PRIVATE LIMITED (L1, L2);
- the four social accounts and the Justdial listing (S1–S3, S5, S6);
- in "Our Ecosystem", Startup India, Amrita TBI, Agnii and the four earlier collaborations, with cautious labels (A1, A3, A4, I1–I4).

DPIIT stays unpublished, pending verification. Nothing else from the previous website has been published. Launch blockers are listed in `docs/LAUNCH_CHECKLIST.md`. Each remaining item below waits for the
owner's decision. Approved items go into the central content files: `src/content/company.ts` (identity, contact, links), `ecosystem.ts` and `gallery.ts`. Unapproved items
are kept out of `src/` on purpose, because anything there ships in the page's JavaScript even when it is not shown.

The previous website is used as a **historical source only**. It is not the authority for the current legal identity.

## How the audit was done

- **Home page.** `index.html` is the only page the site links to. I read its full source: 36 links, 39 images and the
  HTML comments. Every hyperlink destination comes from an actual `href`. I viewed every logo whose `alt` text was
  empty, and I viewed the product images and gallery photographs.
- **Other pages.** I checked for pages that are on the server but not linked from the site:
  - `about-us.html`, `our-services.html`, `our-history.html`, `products.html`, `gallery.html` and `contact.html` all
    exist. Each is a leftover page from the "Financer" HTML template (Responsee), containing lorem-ipsum text and
    sample contact details such as "Aviation Way 99, Los Angeles", `contact@sampledomain.com` and 0800 numbers. Its
    social icons link to `/`. **None of these pages mentions INFINOS, and nothing on them is migrated.**
  - `robots.txt` and `sitemap.xml` do not exist (404).
- **What I did not do.** I did not search other websites. I did not open social accounts to judge whether they belong
  to INFINOS, and I did not look anyone up. Every value below is exactly as the old site shows it.

Status legend:

- **Safe to migrate**
- **Requires confirmation** (your "Requires my confirmation")
- **Outdated — do not migrate**
- **Missing — needs information**

"Source" cites the line number in the old `index.html`.

## 1. Migration table

### Legal identity

| Information | Previous website value | Proposed new value | Source | Status |
|---|---|---|---|---|
| L1 · Legal name | The former LLP name (outdated) | **INFINOSTECH PRIVATE LIMITED**, the registered name confirmed by the owner (2026-10-16). | footer, l. 587, 626 | **Published** (Company section and footer) |
| L2 · Copyright line | A copyright line with the former LLP name | "© {year} INFINOSTECH PRIVATE LIMITED", built from `COMPANY.legalName`. | l. 625–626 | **Outdated — do not migrate** (replaced) |
| L3 · LLP-captioned mark | `img-1/f-1.jpg`: the "infinos™" mark captioned with the former LLP name | Old file and caption not migrated. The new site already uses the same INFINOS mark in the intro and navigation (`public/logo.jpg`, from the INFINOS dashboard). The mark itself carries no LLP wording. | l. 586–587 | **Outdated — do not migrate** (the caption and the old file) |
| L4 · Registered office | "146, Boral Main Road, Kolkata-700084 (Reg.)" | Show only if it is still the registered office of the Private Limited company. | l. 522 | **Requires confirmation** |
| L5 · Registration details | None on the old site | Optional footer line, e.g. the CIN, if you want one. | — | **Missing — needs information** |
| L6 · Brand name | "Infinos Tech" (page title); INFINOS wordmark | INFINOS / INFINOS TECH, already in use. | l. 7, 53–56 | **Safe to migrate** (already in place) |

### Company description and history

| Information | Previous website value | Proposed new value | Source | Status |
|---|---|---|---|---|
| C1 · Hero slogans | "Exploring Innovation for Sustainable Development Goals"; "Revolutionary Product in IOT and Renewable Energy" | Not migrated. SDG alignment (SDG 3, 9, 12) is already on the site from the pitch deck. | l. 87, 109 | **Outdated — do not migrate** |
| C2 · About ("What we do?") | "We are a research-driven team to deliver eco-friendly, clean-tech and robotics applications based products as per your requirements. Our quality team, here at Infinos, would work out every detail to give you the Hardware" (the sentence is cut off on the site) | Replaced by the corrected positioning: *a smart cold-chain and temperature-controlled transportation technology company*. "Research-driven team" could be reused in a background paragraph if you want. | l. 132–136 | **Outdated — do not migrate** (except that phrase, if confirmed) |
| C3 · History and milestones | None. No founding year or timeline; `our-history.html` is template filler. | A short background line: founding year, when the LLP became a Private Limited company, and key milestones you choose. | — | **Missing — needs information** |

### Products from the earlier site

| Information | Previous website value | Proposed new value | Source | Status |
|---|---|---|---|---|
| P1 · Product names | "RenIoT Box (pro)", "RenIoT Box (light)" | Not migrated as products. If they were INFINOS's earlier products, they could appear in a dated history line, but only if you confirm. | l. 191–194 | **Requires confirmation** (only for a history mention) |
| P2 · Product claims and specifications | "Lightweight & temperature sensitive", "Clean-tech & Remotely Controlled", "Flexible Battery backup", "Individual to Industry usage", "Customized Arrangements", "8-50 Liter Capacity", "2-10kg weight", "Customized Cooling and Heating", "Detachable Battery with 4-8hrs backup", "EV Charging enabled", "Solar Charging", "Remotely Control", "Drone enabled", "Customized Space", "No-touch Delivery". Image `BOX DETAILS.png`: "Solar powered", "Customized space", "Balanced temperature control", "Light and hard body". | Not migrated. None of these is verified for the current product range. | l. 155–273 | **Outdated — do not migrate** |
| P3 · Ordering buttons | "PRE-ORDER" and "BOOK A DEMO", both linking to `https://wa.me/+919100674510` | Not migrated as order buttons. A WhatsApp enquiry link may go in Contact (see K5). | l. 198, 203 | **Outdated — do not migrate** (as buttons) |

### Contact

| Information | Previous website value | Proposed new value | Source | Status |
|---|---|---|---|---|
| K1 · Main email | contact@infinostech.com | Unchanged; already published from the owner's final content (2026-10-13). | l. 45–46, 539 | **Safe to migrate** (already in place) |
| K2 · Second email | infinostech@gmail.com | Unchanged; already published. | l. 542 | **Safe to migrate** (already in place) |
| K3 · Phone 1 | +91-9100674510 | Contact section and footer, if the number is current. | l. 530 | **Requires confirmation** |
| K4 · Phone 2 | +91-9591307495 | As K3. | l. 531 | **Requires confirmation** |
| K5 · WhatsApp | `https://wa.me/+919100674510` (behind PRE-ORDER / BOOK A DEMO) | A "WhatsApp" enquiry link in Contact, if the number is current. | l. 198, 203 | **Requires confirmation** |
| K6 · Office address | "IIIT-H Campus CIE, Gachibowli, Hyderabad-500032" | Contact section, only if INFINOS is still based there. | l. 519 | **Requires confirmation** |
| K7 · Registered address | Kolkata (see L4) | — | l. 522 | **Requires confirmation** |
| K8 · Map | Google Maps embed of CIE, IIIT Hyderabad, already commented out (not live) | None | l. 506–511 | **Outdated — do not migrate** |
| K9 · Newsletter | "SUBSCRIBE US" form, commented out (not live, no action URL) | None | l. 613–618 | **Outdated — do not migrate** |

### Social media and external profiles

| Information | Previous website value (exact `href`) | Proposed new value | Source | Status |
|---|---|---|---|---|
| S1 · Facebook | `https://www.facebook.com/Infinos/` | **Published**: footer icon and Contact link, `https://www.facebook.com/Infinos/` | l. 555 · owner, 2026-10-15 | **Approved and published** |
| S2 · Instagram | `https://www.instagram.com/infinostech/` | **Published**: footer icon and Contact link, `https://www.instagram.com/infinostech/` | l. 558 · owner, 2026-10-15 | **Approved and published** |
| S3 · Twitter / X | `https://www.twitter.com/Infinostech`. A commented-out timeline embed uses `https://twitter.com/infinostech`. | **Published**: footer icon and Contact link, `https://x.com/Infinostech` (the URL you supplied) | l. 561, 609–611 · owner, 2026-10-15 | **Approved and published** |
| S4 · LinkedIn | `https://www.linkedin.com/company/13389636`, a numeric company ID; the site does not show the page name. | Not added: it was not in your list of official links. | l. 564 | **Requires confirmation** |
| S5 · Medium | `https://medium.com/@infinostech` | **Published**: footer icon and Contact link, `https://medium.com/@infinostech` | l. 568 · owner, 2026-10-15 | **Approved and published** |
| S6 · Justdial (directory) | `https://www.justdial.com/Hyderabad/Infinos-INSIDE-IIIT-HYDERABD-CAMPUS-Gachibowli/040PXX40-XX40-180615145522-A3R8_BZDET` (shown as "jd") | **Published**: Contact section, under "Business listing", kept apart from the social accounts | l. 567 · owner, 2026-10-15 | **Approved and published** |
| S7 · YouTube | Not linked anywhere on the old site | Add only if you provide the URL. | — | **Missing — needs information** |

### Team (as shown on the old site; all historical)

| Information | Previous website value | Proposed new value | Source | Status |
|---|---|---|---|---|
| T1 | SOURAV KARMAKAR — "Founder & Head" (photo `img-1/team2.jpg`) | Team section with the **current** role. | l. 292–298 | **Requires confirmation** |
| T2 | SOBHON KARMAKAR — "Co-founder & COO" (photo `img-1/team.jpg`) | As T1. | l. 304–310 | **Requires confirmation** |
| T3 | ROHANAK NAIDU — "Business Developement" [sic] (photo `img-1/team-Rohanak.jpg`) | As T1. | l. 316–321 | **Requires confirmation** |
| T4 | NITHISH KUMAR — "Co-ordinator (Bangalore)" (photo `img-1/team-Nitish.jpg`; the file name spells "Nitish") | As T1; the spelling also needs confirming. | l. 327–332 | **Requires confirmation** |

For each person, please confirm three things: whether they are still with INFINOS, their current title, and whether
they consent to their name and photo appearing.

### Endorsements (historical quotes)

| Information | Previous website value | Proposed new value | Source | Status |
|---|---|---|---|---|
| E1 | George Salazar — "NASA" — "Impressive services and capabilities that will support India's space & commercial high-technology sectors as well as STEM education" | Not migrated. | l. 352–360 | **Outdated — do not migrate** |
| E2 | Chiara Chiesa — "Space Advisor" — "I like their product into hardware & space which has unique social value" | Not migrated. | l. 365–375 | **Outdated — do not migrate** |
| E3 | David Iron — "Lunar Mission One" — "A new collaborative edutech growth supporting LM1 in India" | Not migrated. | l. 379–389 | **Outdated — do not migrate** |
| E4 | Larisa Golovko — "Landviser LLC" — "An active & young team of R&D" | Not migrated. | l. 393–402 | **Outdated — do not migrate** |

All four are undated and about the earlier space, edutech and hardware work, not the current cold-chain technology.
Labelling a quote "NASA" next to the company name reads as an institutional endorsement, which the page does not
support. If you still want any of them, they would need a date, the person's current permission, and the label
"historical".

### International collaborations (logos only on the old site; no text, dates or links)

| Information | Previous website value | Proposed new value | Source | Status |
|---|---|---|---|---|
| I1 | Astromerge (logo `img-1/hw-Asset-1@2x.png`) | **Published** in Our Ecosystem as "Earlier collaboration", using the original logo (owner, 2026-10-15) | l. 422 · owner, 2026-10-15 | **Approved and published** (as earlier collaboration) |
| I2 | Lunar Mission One (logo `img-1/LUNAR.png`) | **Published** as "Earlier collaboration" | l. 427 · owner, 2026-10-15 | **Approved and published** (as earlier collaboration) |
| I3 | Logo reading "Wh+" (file `img-1/worldOrg.png`) | **Published** as "WH+", "Earlier collaboration"; the name is kept exactly as WH+ and not expanded (owner) | l. 432 · owner, 2026-10-15 | **Approved and published** (as earlier collaboration) |
| I4 | HelioX Cosmos (logo `img-1/HeliloX.jpg`) | **Published** as "Earlier collaboration" | l. 437 · owner, 2026-10-15 | **Approved and published** (as earlier collaboration) |

### Institutional affiliations, recognition and support (old footer)

| Information | Previous website value | Proposed new value | Source | Status |
|---|---|---|---|---|
| A1 · Startup India | "We're registered under Start Up India Hub" (#startupindia logo) | **Published** in Our Ecosystem as "Earlier registration" (historical claim). Current status for the Private Limited company still to be verified. | l. 581–582 · owner, 2026-10-15 | **Published as historical; verification pending** |
| A2 · DIPP / DPIIT | "DIPP Recognised", with a DPIIT logo that includes the State Emblem | **Not published** (owner, 2026-10-15): it must be verified for the Private Limited company. Never use the emblem logo. | l. 605–606 | **Requires confirmation** (pending verification) |
| A3 · Amrita TBI | Caption: "Supported by Amrita TBI NIDHI PRAYAS". The logo itself says "FUNDED BY AMRITA TECHNOLOGY BUSINESS INCUBATOR". | **Published** as "Institutional support", subject to confirmation. Only the "amrita tbi" mark from the banner is shown, without the "Funded by" text. | l. 591–592 · owner, 2026-10-15 | **Published; confirmation pending** (wording, period) |
| A4 · Agnii | "We're featured under Agnii" (agnii "Igniting ideas" logo) | **Published** as "Featured" | l. 597–598 · owner, 2026-10-15 | **Approved and published** |
| A5 · CIE, IIIT Hyderabad | Implied by the address "IIIT-H Campus CIE"; no stated relationship | Incubation or affiliation line only if you confirm it and say whether it is current. | l. 519 | **Requires confirmation** |
| A6 · Empty footer slot | `<img src="">` with an empty caption | None | l. 601–602 | **Outdated — do not migrate** |

### Gallery and press

| Information | Previous website value | Proposed new value | Source | Status |
|---|---|---|---|---|
| G1 · Gallery | Six images (`img/gallery1–6.jpeg`), no captions. What they show: two workshop or lab photos; two group photos at events; two newspaper clippings (a "Startupedia" page and an article about technology and human intelligence quoting a Governor). | Not migrated. A press or milestone line needs the context, dates, rights to reproduce the clippings, and consent from the people shown. | l. 488–495 | **Requires confirmation** |

## 2. Social media URLs discovered

These are exactly as linked on the old site. **Update, 2026-10-15:** you supplied Facebook, Instagram, X (`https://x.com/Infinostech`), Medium and Justdial as the official links, and they are now on the site. LinkedIn and WhatsApp were not in your list and are not used.

1. Facebook — `https://www.facebook.com/Infinos/`
2. Instagram — `https://www.instagram.com/infinostech/`
3. Twitter / X — `https://www.twitter.com/Infinostech` (also `https://twitter.com/infinostech` in a commented-out
   embed)
4. LinkedIn — `https://www.linkedin.com/company/13389636`
5. Medium — `https://medium.com/@infinostech`
6. Justdial (business directory) —
   `https://www.justdial.com/Hyderabad/Infinos-INSIDE-IIIT-HYDERABD-CAMPUS-Gachibowli/040PXX40-XX40-180615145522-A3R8_BZDET`
7. WhatsApp (enquiry, not social) — `https://wa.me/+919100674510`

No YouTube or other accounts are linked. The template pages' social icons link to `/`, so they point to no account.

## 3. People and organisations

- **Team, all historical:**
  - Sourav Karmakar (Founder & Head)
  - Sobhon Karmakar (Co-founder & COO)
  - Rohanak Naidu (Business Development)
  - Nithish Kumar (Co-ordinator, Bangalore)
- **Endorsers, all historical:**
  - George Salazar ("NASA")
  - Chiara Chiesa (Space Advisor)
  - David Iron (Lunar Mission One)
  - Larisa Golovko (Landviser LLC)
- **International collaborations (logos only):**
  - Astromerge
  - Lunar Mission One
  - an unidentified "Wh+"
  - HelioX Cosmos
- **Institutions:**
  - Startup India
  - DIPP (now DPIIT)
  - Amrita TBI (NIDHI PRAYAS)
  - Agnii
  - CIE at IIIT Hyderabad (implied by the address)

## 4. Outdated or uncertain information — summary

- **Legal identity.** The LLP name, the LLP-captioned logo, and possibly the Kolkata registered office are outdated.
  The registrations (Startup India, DIPP/DPIIT) may be tied to the LLP.
- **Products.** The RenIoT Box products and all their specifications (capacity, weight, battery backup, solar and EV
  charging, drone delivery) are not verified for the current range.
- **Messaging.** The IoT, renewable-energy, robotics and space-hardware framing is superseded by the cold-chain
  positioning.
- **Endorsements and collaborations.** None is dated, and none can be presented as current.
- **Contact.** The phone numbers, the Hyderabad office, and the WhatsApp number may be obsolete.
- **Social accounts.** Activity and ownership have not been verified.
- **Template pages.** Six leftover pages on the old domain publish fake contact details. If the old site stays
  online, consider removing them.

## 5. LLP identity — every instance

**Previous website:**

1. Footer, middle column (l. 586–587): the INFINOS mark (`img-1/f-1.jpg`) captioned with the former LLP name.
2. Footer legal line (l. 625–626): a copyright line with the former LLP name.
3. Indirect: the "(Reg.)" Kolkata address (l. 522), which is the registered office of the entity at that time.
4. Indirect: "registered under Start Up India Hub" and "DIPP Recognised" (l. 582, 606). These recognitions were held
   by the entity of that time.

**New website:**

- **No instance.** "LLP" appears 0 times in `src/`, in the built page HTML and JavaScript, and in `public/`.
  `npm run launch-check` fails if it reappears in `src/`.
- The legal name, **INFINOSTECH PRIVATE LIMITED** (owner, 2026-10-16), appears in two places: the Company section
  ("Company") and the footer ("© 2026 …"). Both read `COMPANY.legalName`.

## 6. Approval needed

1. **L1 — legal name.** Done: INFINOSTECH PRIVATE LIMITED (owner, 2026-10-16). Optionally, a CIN for the footer (L5).
2. **Contact (K3–K7, L4).** Which phone numbers, office address, registered address and WhatsApp number are current
   and may be published.
3. **Social accounts.** Done for Facebook, Instagram, X, Medium and Justdial (published 2026-10-15). Still open: LinkedIn (S4), which was not in your list.
4. **Team (T1–T4).** Who is current, their current titles, and whether names and photos may be published.
5. **Collaborations (I1–I4) and affiliations (A1–A5).** Which to show, whether each is current or past, the years,
   the "supported by" or "funded by" wording for Amrita TBI, and the identity of "Wh+".
6. **Endorsements (E1–E4).** Confirm they stay off the site.
7. **History (C3, P1, G1).** Founding year, the LLP-to-Private-Limited conversion, and any milestones or press you
   want shown.

## 7. Integration once approved

All of this is in the new site's design language: hairline rules, mono labels, and text rather than a logo wall. It
does not copy the old layout, and it does not touch the coolant showcase, the product animation or the performance
work.

- **Data.** Approved values go into `src/content/company.ts`. The site already reads the legal name, emails and website
  from there; `phones`, `addresses` and `social` are ready and empty.
- **Footer.** The legal name, emails, approved phone numbers, approved social links as text links, and the
  registration line if wanted.
- **Contact section.** Email (unchanged), approved phone numbers and office address, and the WhatsApp link.
- **Company / About section.** The corrected positioning (done) and an approved background paragraph (C3).
- **Team.** A restrained list of names and current roles; photos only with consent.
- **Recognition & support.** A single row of approved text lines. Past items are dated and never called "partners".
