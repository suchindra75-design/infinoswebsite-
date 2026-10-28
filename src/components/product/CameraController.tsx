'use client'

import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { useExperienceStore } from '@/state/experienceStore'
import { cameraAt, heroInteractionWeight } from '@/motion/cameraTrack'
import { FILM, filmLayout } from '@/motion/sequences'
import { compositionAt, layoutMode, type Composition } from '@/motion/composition'

/**
 * The camera is a pure function of scroll progress (src/motion/cameraTrack.ts): no time-based tweens, so it never
 * lags behind fast scrolling, never resets when a chapter is entered, and retraces exactly the same path when the
 * visitor scrolls back up. In the reveal and open chapters the track IS the path the photoreal frames were rendered
 * with, which keeps the live model and the frames locked together through the cross-fades.
 */
const look = new THREE.Vector3()
const comp: Composition = { x: 0.5, y: 0.5, s: 1 }

export function CameraController() {
  const get = useThree((s) => s.get)
  const size = useThree((s) => s.size)

  useEffect(() => {
    const camera = get().camera as THREE.PerspectiveCamera
    camera.aspect = FILM.aspect
  }, [get])

  useFrame((state) => {
    const { phase, progress, chapterProgress, pointer, reducedMotion } = useExperienceStore.getState()
    const p = cameraAt(phase, chapterProgress)

    // Pointer parallax in the interactive hero only; zero at its boundaries so hand-offs stay exact. (No time-based
    // idle drift: when nothing changes, nothing is rendered.)
    const w = reducedMotion ? 0 : heroInteractionWeight(phase, chapterProgress)
    look.set(p.target[0] + pointer.x * 0.12 * w, p.target[1] + pointer.y * 0.07 * w, p.target[2])

    const camera = state.camera as THREE.PerspectiveCamera
    camera.position.set(p.pos[0], p.pos[1], p.pos[2])
    // editorial framing (composition.ts) — the identical film rectangle the image-sequence canvas draws with
    const l = filmLayout(size.width, size.height, p, compositionAt(progress, layoutMode(size.width, size.height), comp))
    camera.fov = p.fov
    camera.setViewOffset(l.w, l.h, l.ox, l.oy, size.width, size.height)
    camera.updateProjectionMatrix()
    camera.lookAt(look)
    if (process.env.NODE_ENV !== 'production') {
      ;(window as unknown as { __infinosCamera?: number[] }).__infinosCamera = [...camera.position.toArray(), camera.fov]
    }
  })

  return null
}
