import { MODEL_COMPONENTS } from '@/content/products'
import type { StageAmounts, Vec3 } from '@/motion/sequences'

/**
 * World position of a point on a product layer, for the editorial callouts.
 *
 * Same rigid-body pose as the 3D layers (motion/pose.ts) and the Blender renders: the layer turns about its pivot
 * (basePosition) by the sum of its opening rotations and slides by its opening translations. The model root is
 * auto-scaled to 1.8 m tall and grounded (ProductModel.tsx); with the v0.3 bounding box (tools/t1_model_report.json:
 * x −0.2248…0.2239, y −0.0072…0.5248, z −0.2110…0.1988 in glTF axes) that is a uniform ×3.3835 plus the offset below.
 * Dependency-free on purpose: the overlay ships in the main bundle, three.js does not.
 */
const ROOT_SCALE = 1.8 / (0.52481 + 0.00718)
const ROOT_OFFSET: Vec3 = [
  -((-0.2248 + 0.22386) / 2) * ROOT_SCALE,
  0.00718 * ROOT_SCALE,
  -((-0.211 + 0.1988) / 2) * ROOT_SCALE,
]

const SPECS = new Map(MODEL_COMPONENTS.map((c) => [c.id, c]))

/** three.js Euler 'XYZ' (R = Rx · Ry · Rz) applied to v */
function rotate(v: Vec3, rx: number, ry: number, rz: number): Vec3 {
  let [x, y, z] = v
  let c = Math.cos(rz), s = Math.sin(rz)
  ;[x, y] = [x * c - y * s, x * s + y * c]
  c = Math.cos(ry); s = Math.sin(ry)
  ;[x, z] = [x * c + z * s, -x * s + z * c]
  c = Math.cos(rx); s = Math.sin(rx)
  ;[y, z] = [y * c - z * s, y * s + z * c]
  return [x, y, z]
}

/** `point` is in model space (glTF metres, as in hotspots.ts); returns scene/world coordinates */
export function anchorWorld(componentId: string, point: Vec3, stages: StageAmounts): Vec3 {
  const spec = SPECS.get(componentId)
  let p: Vec3 = point
  if (spec) {
    let tx = 0, ty = 0, tz = 0, rx = 0, ry = 0, rz = 0
    for (const m of spec.open ?? []) {
      const a = stages[m.stage] ?? 0
      if (m.translate) { tx += m.translate[0] * a; ty += m.translate[1] * a; tz += m.translate[2] * a }
      if (m.rotate) { rx += m.rotate[0] * a; ry += m.rotate[1] * a; rz += m.rotate[2] * a }
    }
    const b = spec.basePosition
    const r = rotate([point[0] - b[0], point[1] - b[1], point[2] - b[2]], rx, ry, rz)
    p = [b[0] + tx + r[0], b[1] + ty + r[1], b[2] + tz + r[2]]
  }
  return [p[0] * ROOT_SCALE + ROOT_OFFSET[0], p[1] * ROOT_SCALE + ROOT_OFFSET[1], p[2] * ROOT_SCALE + ROOT_OFFSET[2]]
}
