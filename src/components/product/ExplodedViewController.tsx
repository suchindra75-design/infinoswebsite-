'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getRegisteredComponents } from './ProductComponentRegistry'
import { useExperienceStore } from '@/state/experienceStore'
import { layerPose } from '@/motion/pose'

/**
 * Applies the scroll-scrubbed pose to every registered layer (src/motion/pose.ts):
 *  - stages         : flap -> lid -> drop panel -> inner box out -> inner box lid (hinges + slide, shape unchanged)
 *  - explodedAmount : layers separate along spec.explode.dir (and settle at spec.explode.rotate)
 * Layers never deform; only rigid transforms are applied. The pose is applied exactly (no time-based easing): it is a
 * pure function of scroll progress, already smoothed by Lenis, so the live model stays frame-locked to the photoreal
 * sequences and scrolling backwards reverses every motion precisely.
 */
export function ExplodedViewController() {
  const tmpPos = useMemo(() => new THREE.Vector3(), [])
  const tmpRot = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const { explodedAmount, stages, isMobile } = useExperienceStore.getState()
    const scale = isMobile ? 0.55 : 1

    for (const entry of getRegisteredComponents()) {
      const { object, basePosition, baseRotation, spec } = entry
      layerPose(spec, stages, explodedAmount, scale, basePosition, baseRotation, tmpPos, tmpRot)
      object.position.copy(tmpPos)
      object.rotation.set(tmpRot.x, tmpRot.y, tmpRot.z)
    }
  })

  return null
}
