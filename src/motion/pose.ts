import * as THREE from 'three'
import type { ProductComponentSpec } from '@/content/products'
import type { StageAmounts } from '@/motion/sequences'

/**
 * Rigid-body pose of one product layer (the bag never deforms):
 *   open pose     = rest + sum over the layer's opening motions of (stage amount x rotate / translate)
 *   exploded pose = rest + explode.dir x distance (+ explode.rotate, or the fully-open hinge angle)
 *   final         = lerp(open, exploded, explodedAmount)
 * Positions are in the model root's local space (model metres). tools/build_infinos_bag.py#apply_stage_pose and
 * tools/render_sequences.py apply the same opening motions to the Blender groups.
 */
export function layerPose(
  spec: ProductComponentSpec,
  stages: StageAmounts,
  exploded: number,
  explodeScale: number,
  basePosition: THREE.Vector3,
  baseRotation: THREE.Euler,
  outPos: THREE.Vector3,
  outRot: THREE.Vector3,
) {
  let px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0
  let fx = 0, fy = 0, fz = 0
  for (const m of spec.open ?? []) {
    const a = stages[m.stage] ?? 0
    if (m.translate) {
      px += m.translate[0] * a; py += m.translate[1] * a; pz += m.translate[2] * a
    }
    if (m.rotate) {
      rx += m.rotate[0] * a; ry += m.rotate[1] * a; rz += m.rotate[2] * a
      fx += m.rotate[0]; fy += m.rotate[1]; fz += m.rotate[2]
    }
  }
  const e = exploded
  const d = spec.explode
  const ex = d.rotate ?? [fx, fy, fz]
  const k = d.distance * explodeScale
  outPos.set(
    basePosition.x + px * (1 - e) + d.dir[0] * k * e,
    basePosition.y + py * (1 - e) + d.dir[1] * k * e,
    basePosition.z + pz * (1 - e) + d.dir[2] * k * e,
  )
  outRot.set(
    baseRotation.x + rx * (1 - e) + ex[0] * e,
    baseRotation.y + ry * (1 - e) + ex[1] * e,
    baseRotation.z + rz * (1 - e) + ex[2] * e,
  )
}
