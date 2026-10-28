# Mockup source (not production code)

Files carry a `.txt` suffix so the site's type-check and lint skip them; drop the suffix to run them.

These scripts produced the round-2 art-direction mockups. They inject a concept into the production build in a
headless browser; nothing in the site is changed.

- `buildcore.mjs`: bundles the site's own camera, composition and film maths (`src/motion`) into `core.js` for the
  browser (Node 24, types stripped).
- `env.js` / `env.css`: the environment engine. It draws the cyclorama, floor pool, wall wash, edge falloff, the mocked
  live-chapter contact shadow and the frame-edge extension, plus the light-tone overlay styles.
- `concepts/*.js`: palettes and lighting plans for Noir, Atelier (First Light) and Acts.
- `cap.mjs` (stills at story positions, including the coolant showcase), `opening.mjs` (the intro handing over).
- `boards.py`, `conceptboard.py`, `evidence.py`: the boards. `contrast2.py`: body-text contrast per chapter.
  `present.py`: builds `../index.html` from `docs/PROPOSAL_ART_DIRECTION_R2.md`.

Capture, from this folder:

```bash
node buildcore.mjs ../../../../src/motion core.js
```

```bash
node cap.mjs http://localhost:3300/ out/atelier_d atelier 0,0.15,0.25,0.38,0.44,0.55,0.66,0.78,0.95,cx0,cx1
```
