# INFINOS T-1 — model + photoreal sequence pipeline (v0.3)

Everything visual on the site comes from one parametric source, `tools/build_infinos_bag.py` (Blender 4.0+; built
and verified with **Blender 4.5.9 LTS**). It produces both the interactive GLB and — through
`tools/render_sequences.py` — the photoreal Cycles frames, so the two can never show different bags.

```bash
export BLENDER=/path/to/Blender.app/Contents/MacOS/Blender   # or have `blender` on PATH

npm run model:build        # Blender -> tools/build/t1.glb (+ AO bake) -> tools/optimize_glb.mjs -> public/models/t1.glb
npm run sequences:render   # Cycles frames -> tools/build/frames/<seq>/NNNN.png   (resumable: --skip-existing)
npm run sequences:encode   # -> public/sequences/<seq>/{desktop,mobile}/NNNN.webp (transparent WebP)
```

`model:build` also writes `tools/build/t1_components.generated.ts` (paste into `src/content/products.ts` as
`MODEL_COMPONENTS` if the layer table changes) and `tools/build/t1_model_report.json` (bbox, per-object triangles;
a copy of the current one is kept at `tools/t1_model_report.json`).

## Stages

1. **Generate** (`build_infinos_bag.py`): sewn padded fabric volumes, piping, stitches, zips, procedural woven
   textures, decals. Parameters at the top are tagged `[PHOTO]`, `[PHOTO-RELATIVE]`, `[PROVISIONAL]`, `[UNKNOWN]`.
   See `docs/MODEL_VALIDATION.md` for what each v0.3 change was checked against.
2. **Bake AO** (same script, skipped with `--no-ao`): Cycles ambient occlusion baked per component into an `AO`
   colour attribute, exported as `COLOR_0` (three.js multiplies it into the base colour). Each layer is baked alone so
   nothing is darkened by a neighbour it only touches when closed; decals/stitches don't occlude.
3. **Optimise** (`optimize_glb.mjs`): dedup/prune/weld, bounded-error meshopt simplification (default error 0.0005 ×
   each mesh's radius — small parts are untouched), `EXT_meshopt_compression` + quantisation. The output's meshopt
   fallback buffer has no data by design; that is valid glTF.
4. **Render sequences** (`render_sequences.py`): runs the generator in-session, then for every frame of every
   sequence in `src/content/sequences.json` sets the camera (Catmull-Rom path, sine ease) and the opening stages
   (smoothstep windows) with the same maths as `src/motion/sequences.ts`. Lighting mirrors
   `src/components/product/LightingSystem.tsx` (suns = directional lights, emissive softboxes = Lightformers),
   colour management = *Khronos PBR Neutral* at the site's exposure (= `THREE.NeutralToneMapping`). Transparent film +
   shadow catcher. 12 samples + OpenImageDenoise (no aux prefilter keeps fabric detail): ~25–45 s per 1440×900 frame
   on a 6-core i7 (Blender 4.5 has no Metal device for AMD GPUs).
5. **Encode** (`encode_sequences.py`): desktop 1440×900 and mobile 960×600 transparent WebP.

## Coordinate conventions

* Blender: metres, front = −Y, display side = +X. glTF/three.js: front = +Z.
* The site scales the model to 1.8 world units tall (`PRODUCT.model.targetHeightMeters`); camera paths in
  `sequences.json` are in those world units. The renderer maps a three.js point `P` to Blender as
  `(P.x, −P.z, P.y) / k` with `k = 1.8 / model height`.
* Opening motions (`open: [{ stage, rotate, translate }]` per layer) are emitted by the generator's `LAYERS` table
  and applied identically by `src/motion/pose.ts`, `apply_stage_pose()` (previews) and the sequence renderer.

## Dev QA

`/dev/model-review?src=/models/t1.glb` (development builds only) renders the GLB with photo-matched cameras and a
`window.__review` API (`setView`, `setCamera`, `setPose({ open, exploded })`, `setRender`); `?debug=normals` shows
shading normals.

## Not modelled

No cooling hardware, battery or electronics; no ZIPCOOL branding (only the taped "infinos" sticker is reproduced).
