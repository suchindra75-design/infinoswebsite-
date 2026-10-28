# INFINOS Tech — website

Scroll-driven product story for the INFINOS T-1 transport bag: photoreal image sequences (Blender Cycles) that
cross-fade into an interactive 3D model (three.js / React Three Fiber), orchestrated with GSAP ScrollTrigger + Lenis.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm run lint && npm run typecheck
```

## How it fits together

* **One source for every image of the product** — `tools/build_infinos_bag.py` generates the photo-validated model
  (`public/models/t1.glb`) and `tools/render_sequences.py` renders the photoreal frames (`public/sequences/`) from the
  same generator. See `docs/MODEL_VALIDATION.md` (what was checked against the reference photographs) and
  `docs/MODEL_PIPELINE.md` (commands: `npm run model:build`, `sequences:render`, `sequences:encode`).
* **One camera / pose definition** — `src/content/sequences.json` drives both the Cycles renderer and the live scene,
  so frames and model line up during cross-fades. If frames are missing the live scene plays the same path.
* **Narrative** — chapters in `src/motion/chapters.ts`; architecture in `docs/ARCHITECTURE.md`.
* **Explore** — in the hero chapter, drag to rotate the model; markers turn features toward the camera.

Product facts that the photographs do not establish (dimensions, thermal performance, sensors, certifications) are
kept as placeholders throughout the copy.
