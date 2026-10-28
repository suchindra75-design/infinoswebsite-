# Report — timed intro + split-screen scroll story

## A. Timed opening (`src/components/hero/IntroSequence.tsx`)
A single state machine, `loading → logo → outro → product → settle → ready`, scheduled from page load; each step
starts only after the previous one finishes, so the logo and the product can never animate together. Scroll is locked
(and the page pinned to the top) until `ready`.

| Phase | What happens |
|---|---|
| 0–2 s loading | Dark studio, brand loading line; product hidden; the 2560 × 1600 reveal frames preload |
| 2 s logo | Real INFINOS TECH logo (mark + wordmark + tagline): fade, slight scale (0.94 → 1) and rise |
| 3.62 s outro | Logo leaves (fade, 1.04 scale, lift) — waits for the frames if they are late (max 10 s) |
| ~4.2 s product | The bag fades in by visibility only — frame 0 of the 2560 × 1600 sequence, already sharp |
| settle | The stage glides from full width into the left split panel; the bag keeps its size (framing is height-based) |
| ready | Editorial column fades in on the right, navigation appears, scrolling starts |

Measured in the production build: logo starts 2.00–2.02 s, clearly visible 1.60–1.77 s, gone ~4.1 s, product first
visible 4.19–4.22 s, 0 frames with logo and product both visible (desktop ×2, tablet, mobile). The first fully revealed
product frame is identical to the settled view (bag 907 px, same sharpness and exposure).

## B/C. Split-screen story
- **Left:** sticky product stage (58 % width; top 56 svh on phones / portrait tablets) with the photoreal sequences and
  the live v0.3 model. Framing: the 16:10 film is sized by the stage height and panned so the camera track's *subject*
  point sits at the stage centre — the same function frames the image sequence and the live camera.
- **Right:** editorial column (`src/components/sections/StoryColumn.tsx`, content `src/content/story.ts`) — 8 chapters:
  overview · exterior · thermal protection · compartments · inner box · organisation · display · complete system.
  Copy is limited to what the photographs establish; unknowns (insulation performance, removability, sensor specs)
  are stated as not yet specified. The illustrative thermal HUD, telemetry HUD and liner glow were removed.
- **One progress system:** the single ScrollTrigger drives the camera track, poses, frames and the text; each text
  chapter's opacity/rise is a pure function of the same progress (`STORY_RANGES`), so everything reverses naturally.

| Chapter | Product pose (same progress range) |
|---|---|
| 01 Overview | photoreal reveal → interactive hero (drag, hotspots) |
| 02 Exterior | flap close-up → side display/biohazard → front emblem |
| 03 Thermal protection | flap and padded lid lift (photoreal) |
| 04 Compartments | drop-down front opens (photoreal) |
| 05 Inner box | box slides out, reflective lid opens (photoreal) |
| 06 Organisation | looking down onto liner + rack |
| 07 Display | bag closes, side display close-up |
| 08 Complete system | exploded, labelled layers + 360° / contact CTAs |

## Tested (real browser, dev + production)
Intro timing (above); chapter sync — text chapter, rail marker and product phase agree at every chapter (desktop,
tablet portrait 768 × 1024, tablet landscape 1024 × 768, mobile 390 × 844); timeline continuity at all boundaries
incl. framing (≤ 6e-9, reverse identical); wheel scrolling fast and slow, down and up, repeated — 0 blank frames,
no camera jumps; the intro-to-stage settle redraws every frame (a blank-canvas bug during the settle was found and
fixed); 360° viewer 24/24 desktop + mobile; reduced motion; no-WebGL; no console errors or failed requests.
Screenshots: `docs/screenshots/` (intro phases desktop + mobile; all 8 chapters desktop, tablet, mobile).
