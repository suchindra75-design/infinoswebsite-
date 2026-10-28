# INFINOS T-1 asset audit and hybrid animation implementation notes

## Reference material inspected
- `IMG-20261009-WA0014.pdf` (13 pages): real product photographs covering front, rear straps, side display, open upper compartment, open lower compartment, insulated insert, reflective lid, rack, and side views.
- Existing website archive: `infinos-website-photoreal.zip`.
- Existing model integration archive: `infinos-model-integration.zip`.

## GLB validation finding (corrected)
The original diagnosis — "`t1.glb` declares two buffers but has one BIN chunk, so it is broken" — was **wrong**. The
second buffer is the `EXT_meshopt_compression` *fallback* buffer (`"extensions": {"EXT_meshopt_compression":
{"fallback": true}}`), which by specification has no data. three.js `GLTFLoader` with the meshopt decoder (enabled by
default in drei's `useGLTF`) loads it; a parser that ignores the extension fails. Verified in the browser: the file
loads with all ten component nodes (139,432 triangles).

The recovery had replaced it with the older v0.1 integration model. Both files are now archived in
`tools/legacy-models/`, and `public/models/t1.glb` is the photo-validated v0.3 model (65.7k triangles, 4.25 MB) —
see `docs/MODEL_VALIDATION.md`.

## Reference-derived appearance requirements
Use the 13-page PDF as the visual source of truth. It shows:
- Red quilted outer front panels with black binding and black body fabric.
- Orange inner lid and compartment lining.
- Rear padded red/black shoulder straps.
- Side-mounted digital display and biohazard emblem.
- Front-opening lower compartment and orange drop-down panel.
- Removable-looking black insulated insert with reflective silver inner lid, dark dividers, and a white perforated rack.
- A black/orange upper compartment with a rear mesh pocket.

Do not infer exact dimensions, thermal ratings, electronics, or unseen hardware from these photographs.

## Hybrid animation — implemented
1. The GLB is the interactive source: drag rotation and explore hotspots (hero chapter), staged opening, exploded
   layers, thermal and telemetry chapters.
2. Photoreal image sequences are rendered in Blender Cycles **from the same generator** as the GLB
   (`tools/render_sequences.py`) — no AI-generated frames, no morphing geometry.
3. `src/components/sequence/ImageSequence.tsx` draws the frames on a canvas scrubbed by the GSAP ScrollTrigger
   progress, loading progressively (endpoints, then strides 16 → 1) with nearest-frame fallback. If frames are missing
   the live 3D scene plays the identical camera path and pose.
4. Sequence and live scene share one camera path / pose definition (`src/content/sequences.json`) and one film-frame
   layout, so they cross-fade at chapter boundaries without a visible jump (verified by blending captures: edges
   align to ~1–2 px).
5. Chapter structure retained; reveal and open chapters are sequence-driven, all others live.

## Outstanding validation
- Obtain physical dimensions or a known scale reference before setting final model height.
- ~~Compare the GLB against matching views from the PDF and correct geometry/material differences.~~ Done (v0.3), pending owner approval.
- Confirm whether the inner insert is removable; photographs show it separately, but do not establish every mechanical detail.
- Confirm display readout, sensor specifications, cooling/heating capabilities, and telemetry before publishing as product facts.
- Approve the rendered reveal/open image sequences (`public/sequences/`).
