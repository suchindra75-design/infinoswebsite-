# Cinematic Industrial Luxury — audit and design system

Visual refinement of the existing INFINOS website (2026-10-16). Not a rebuild: architecture, scroll engine, 3D, intro
timing and every interaction stay as they are. Before screenshots: build of commit `5159022` (scratchpad tour, desktop
1440×900 and phone 390×844, 29 positions each).

## 1. Audit — the ten most important visual weaknesses

1. **One colour from intro to footer.** Every surface is near-black `#0a0b0e`; the page has no light/dark rhythm, so
   twelve sections read as one long dark scroll and nothing signals a change of subject.
2. **A warm interface accent.** The only accent is amber `#c27a3a` (chapter numbers, kickers, nav "360° view", hotspot
   markers, focus rings, buttons); the intro adds coral and gold glows. It competes with the red of the product instead
   of letting the product be the only saturated colour.
3. **The product sits on a black void.** The studio backdrop is almost black, so the bag's dark navy lower body merges
   into it; contact shadows (baked into the frames) have nothing to fall on; there is no sense of a physical studio.
4. **Illegible micro-labels.** Section labels, notes and captions are 8–9.6 px mono capitals in `#5d6570` on black:
   2.9:1 contrast (fails WCAG AA). Much of the site's careful honesty ("projected at scale", "illustrative") is unreadable.
5. **Flat hierarchy.** Section titles, the company statement and the contact title share one scale; body copy and
   ledes are nearly the same; the introduction does not read as a company statement.
6. **Left-heavy compositions.** Every supporting section is kicker → title → paragraph in a ~640 px left column, leaving
   the right half of large screens empty; the sections are interchangeable.
7. **Industries as five unrelated columns.** Current products and four potential applications are five equal narrow
   columns; the important distinction (current vs potential) is carried only by a small amber label.
8. **Repetitive dividers.** The same 6–14 % hairline separates sections, rows, lists and items, so structure is
   everywhere and nowhere.
9. **Card-like ecosystem plates.** Light rounded cards are the only light surfaces on the page; on black they read as a
   generic logo wall.
10. **Generic chrome.** Navigation links and the footer are tiny, low-contrast mono; the intro's coral/gold light streaks
    and bokeh feel decorative rather than engineered.

## 2. Colour tokens

| Token | Value | Role |
|---|---|---|
| `--graphite` | `#171B1F` | Deep graphite: intro, studio, coolants, range, contact |
| `--graphite-deep` | `#111417` | Floor/vignette, footer band |
| `--slate` | `#292F34` | Slate graphite: technology, gallery |
| `--ivory` | `#EAE7DF` | Warm ivory: industries, applications, company |
| `--white` | `#F7F6F2` | Soft white: impact, ecosystem; headline text on dark |
| `--steel` | `#8496A3` | Steel blue-grey: the only interface accent (dark surfaces) |
| `--steel-light` | `#A9B7C1` | Accent on slate; hover on graphite |
| `--steel-dark` | `#4B5D6A` | Accent on ivory/white |

Semantic tokens switch with the surface (`.tone-*` classes), so every component reads `--text-strong`, `--text`,
`--muted`, `--faint`, `--line`, `--line-strong`, `--accent` and inherits the right values:

| | Dark surfaces | Light surfaces |
|---|---|---|
| `--text-strong` (titles) | `#F7F6F2` — 16.0:1 on graphite | `#171B1F` — 14.0:1 on ivory |
| `--text` (ledes, values) | `#D5D9DC` — 12.2:1 | `#2B3136` — 10.7:1 |
| `--muted` (body) | `#A7B0B8` — 7.9:1 | `#50585F` — 5.9:1 |
| `--faint` (labels, notes) | `#8E98A0` — 5.9:1 (4.6:1 on slate) | `#5F676E` — 4.7:1 |
| `--accent` | steel `#8496A3` — 5.7:1 (slate: steel-light 6.6:1) | steel-dark `#4B5D6A` — 5.5:1 |

All text pairs meet WCAG AA for small text. **Red is reserved for the product** (bag model, frames, render): no red or
coral in the interface — the one red illustration stroke (Sensorial container) becomes steel; the intro's decorative
coral/gold glows become ivory and steel. The INFINOS logo mark and the van livery keep their brand colours.

## 3. Section colour map

| Section | Surface | Notes |
|---|---|---|
| Intro | Deep graphite | Same 4 s timeline; neutral light streaks; logo unchanged |
| Hero and bag story | Graphite studio | A lit cyclorama behind the product: lighter wall, soft key-light pool, darker floor falloff, vignette, fine grain (dithering). Kept dark: the story's text sits over the product, and the frames' shadow catcher expects a dark floor |
| Coolant showcase | Deep graphite, cool light pool | The studio backdrop is shared with the stage (identical by construction) so the hand-over is invisible |
| Positioning + industries | **Warm ivory** | The company statement at display size; industries as an editorial composition |
| Applications | Warm ivory (hairline join) | Continues the light chapter |
| Technology | Slate graphite | Cool-toned figures stay light-on-dark |
| Impact | **Soft white** | |
| Product range | Deep graphite studio | The red render on a lit pool, illustrations in steel |
| Gallery | Slate graphite | Dark editorial frame for the two crops |
| Company | **Warm ivory** | |
| Ecosystem | **Soft white** | Square white plates on a hairline grid instead of cards |
| Contact + footer | Deep graphite, footer band deeper | |

Light story chapters were considered and rejected: the photoreal frames carry a baked shadow-catcher shadow and the
chapter text and callouts sit over the product; a light studio would need new frames and new legibility rules.

## 4. Typography and layout

- Fonts unchanged (DM Sans variable, IBM Plex Mono, Syne only in the intro). Hierarchy: **display** (company statement,
  contact) `clamp(2.75rem, 6.2vw, 6rem)`, weight 380, tracking −0.045em; **section title** `clamp(2.2rem, 4vw, 3.6rem)`;
  **h3** `clamp(1.25rem, 1.7vw, 1.6rem)`; **lede** `clamp(1.06rem, 1.25vw, 1.25rem)` in `--text`; **body** 1rem/1.65 in
  `--muted`; **labels** mono 0.6875rem, 0.18em tracking, `--faint` (kickers in `--accent`).
- Measure: ledes ≤ 36em, body ≤ 34em. Section heads use a two-column editorial grid on large screens (title left, lede
  right) so the right half of the page is used; single column below 1000 px.
- Vertical rhythm from one spacing scale (section padding `clamp(96px, 14vh, 168px)`, head → content
  `clamp(48px, 7vh, 88px)`).
- Dividers: hairlines only inside a section's structure; tone changes divide sections.

## 5. Product hero

Constraints found in the code: the hero and story composite **pre-rendered Cycles frames** (transparent film + shadow
catcher) and the **live model**, framed identically and calibrated to match at every hand-over (camera, pose, exposure,
`displayGain`). Blender is not installed, so frames cannot be re-rendered. Therefore the bag's geometry, materials,
lighting rig, camera paths and scale stay unchanged — changing any of them on the live model alone would show as a jump
at the hand-overs. The presence of the product is improved where both layers share it, the CSS studio behind them:

- a lit graphite cyclorama (wall lighter at the product's height, floor falling off, edge vignette) so the dark lower
  body and the red quilting separate from the background;
- a soft key-light pool behind the product's usual position; fine grain against gradient banding;
- the baked contact shadows become visible because they now fall on a mid-tone floor instead of black;
- legibility scrims retinted from black to graphite, so text areas deepen the studio rather than cutting holes in it.

## 6. What does not change

Intro timeline and scroll lock, product reveal, camera track, exploded view, component registry, coolant selection and
canvas optimisations, 360° viewer, gallery behaviour and photo-consent rules, social links, navigation, responsive
breakpoints' behaviour, reduced motion, no-WebGL fallback, content and claims.
