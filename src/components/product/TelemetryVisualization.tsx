'use client'

import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useExperienceStore } from '@/state/experienceStore'
import { requestFrame } from '@/motion/frameLoop'

export const sensorTarget = { current: null as THREE.MeshStandardMaterial | null }

/** The real OLED stays steadily lit (no pulsing / glow); it simply reads brighter while it is the focus. */
export function TelemetryVisualization() {
  useFrame((_, delta) => {
    const material = sensorTarget.current
    if (!material) return
    const { phase } = useExperienceStore.getState()
    const goal = phase === 'display' ? 1.0 : 0.75
    material.emissiveIntensity += (goal - material.emissiveIntensity) * (1 - Math.pow(0.01, Math.min(delta, 0.1)))
    if (Math.abs(goal - material.emissiveIntensity) > 0.002) requestFrame()
  })
  return null
}
