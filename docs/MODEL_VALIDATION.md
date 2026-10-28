# INFINOS T-1 model — photo validation (v0.3)

**Status: awaiting owner approval.** The model was corrected against the 13 reference photographs
(`IMG-20261009-WA0014 … WA0031.jpg`, identical to the 13 pages of `IMG-20261009-WA0014.pdf`) and every change
below was checked visually against them. Side-by-side sheets (render | photograph) are in
[`docs/model-validation/`](model-validation/). If anything is wrong, change the parameter in
`tools/build_infinos_bag.py` and run `npm run model:build` (and `npm run sequences:render` + `npm run sequences:encode`
for the photoreal frames).

## What was wrong with the recovered model

1. `public/models/t1.glb` in the recovery was the **older v0.1 model** (hard bevelled boxes) — not the output of the
   generator in `tools/`. The website's component positions and camera presets had been tuned for v0.2.
2. The file previously labelled "invalid" (`t1-invalid-original.glb`, now
   `tools/legacy-models/t1-v0.2-meshopt-valid.glb`) is **valid glTF**: its second buffer is the
   `EXT_meshopt_compression` *fallback* buffer, which by spec carries no data. three.js/drei load it with the meshopt
   decoder (enabled by default in `useGLTF`); only parsers that ignore the extension report it as broken.
3. Against the photographs, v0.2 still had the errors fixed below.

## Corrections (v0.3)

| Area | Before | After | Evidence |
|---|---|---|---|
| Upper / lower body height | 0.220 / 0.250 m (upper visibly shorter) | 0.235 / 0.250 m | red side panels measure ~0.95 : 1 in WA0016, WA0027, WA0031 |
| Lid + flap stack | 4.0 cm above the rim | 3.25 cm | top band in WA0031 |
| Flap length | hem 0.150 m below the rim | 0.172 m (covers ~76 % of the upper front) | WA0019 |
| Flap quilting | sinusoidal waves | traced "plateau" stitch lines: low at both edges, S-rise near 20 %, flat raised middle, S-fall near 80 %; 4 lines on the front, deep grooves | WA0019 (sheet 03) |
| Carry handle | padded arch on top | **removed** (optional flag `INCLUDE_CARRY_HANDLE`) | no handle in any photo; WA0019 silhouette |
| Display plate | 0.112 × 0.066 m, sharp box, small screen | 0.132 × 0.082 m (0.445 × side depth), rounded glossy acrylic, 4 corner screws, centred OLED module with its own screws/holes, just above the seam | WA0016 |
| OLED text | `TEMP 24.0C / WIFI DISCONNECTED` | `TEMP : 24.19°C`, rule, Wi-Fi icon + `WiFi Disconnected` (as photographed — illustrative, not a spec) | WA0016 |
| Biohazard embroidery | malformed symbol (inverted crescents) rotated 90° | least-squares fit of the real symbol (crescents open outward, merged hub, centre hole, ring only inside the openings), upright, 0.265 × panel depth, 41 % up the panel | WA0031 (fit), WA0016 |
| Shoulder straps | centres ±0.089 m | centres ±0.066 m, 0.10 m wide at the top tapering to 0.072 m | WA0015 |
| −X upper side | plain | stitched sleeve-pocket panel (back edge → 87 % of the depth) | WA0023, WA0027, WA0029, WA0031 |
| +X upper side | plain | stitched seam across the top | WA0016 |
| Back | single slab | seam between the two compartment backs | WA0015 |
| Rack | 10 × 9 holes | 12 × (3 front + 4 back) with a solid bar, raised +X end wall | WA0026, WA0028 |
| Woven tag | centre of the back wall | left of centre | WA0014, WA0021 |
| Inner box lid | opened 100° while still inside the bag (swung through the upper compartment floor) | opens only after the box slides out (0.36 m, lifted onto the opened drop panel), ~95° | WA0026, WA0028, WA0029 |
| Lining / liner colours | orange (255,104,12), matte silver | yellow-orange (255,122,10), glossy PVC silver, glossy acrylic plate | WA0014, WA0021, WA0026, WA0028 |
| Black fabric | 0.6 % reflectance (rendered as dead black) | 1.3 % — dusty charcoal | WA0019 |
| Material edges | jagged orange/silver borders on the lids and drop panel | clean split hidden under the edge binding | renders |

Real-time presentation fixes found during validation (website, not geometry): ACES tone mapping clipped the red
channel (salmon/orange red, flat quilting) → Neutral tone mapping; the diffuse light rig flattened padding → a
dominant directional key; baked per-component ambient occlusion (`COLOR_0`) for crevices.

Budget: 113k triangles from Blender → **65.7k** after bounded-error simplification (≤ 0.05 % of each part's radius),
4.25 MB with meshopt compression (targets: < 100k triangles, ≤ 5 MB).

## Still NOT established by the photographs

Absolute scale (no measured dimensions; the site scales the model to a fixed display height); wall/insulation
construction; zipper routing details; the grey item and cable in the inner box's right bay; the underside; whether
the inner box is designed to be removed (it is shown sliding out because the photographs show it outside the bag);
display readings, sensors, cooling/heating performance — all copy keeps its placeholder flags.
