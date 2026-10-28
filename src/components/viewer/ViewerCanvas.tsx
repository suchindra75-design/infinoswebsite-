'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls, useGLTF } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { PRODUCT } from '@/content/products'
import { LightingSystem } from '@/components/product/LightingSystem'
import { applyRenderSettings } from '@/components/product/renderSettings'
import { useViewerStore, type ViewName } from '@/state/viewerStore'
import { useExperienceStore } from '@/state/experienceStore'

/** The product stands 1.8 world units tall on y = 0 (same normalisation as the narrative); the camera orbits its centre. */
const TARGET = new THREE.Vector3(0, 0.9, 0)
const HOME = { theta: -0.5, phi: 1.22, radius: 5.6 }
const MIN_R = 2.4
const MAX_R = 9.5
const VIEWS: Record<ViewName, { theta?: number; phi: number }> = {
  front: { theta: 0, phi: Math.PI / 2 - 0.08 },
  right: { theta: Math.PI / 2, phi: Math.PI / 2 - 0.08 }, // +X: display side
  rear: { theta: Math.PI, phi: Math.PI / 2 - 0.08 },
  left: { theta: -Math.PI / 2, phi: Math.PI / 2 - 0.08 },
  top: { phi: 0.06 }, // keep the current heading, look straight down
}

/** The v0.3 GLB, cloned (materials shared, never modified), normalised exactly like ProductModel, closed pose. */
function ViewerModel() {
  const gltf = useGLTF(PRODUCT.model.source as string)
  const scene = useMemo(() => gltf.scene.clone(true), [gltf])
  const root = useRef<THREE.Group>(null!)
  useEffect(() => {
    const g = root.current
    g.scale.setScalar(1)
    g.position.set(0, 0, 0)
    g.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(g)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const k = PRODUCT.model.targetHeightMeters / size.y
    g.scale.setScalar(k)
    g.position.set(-center.x * k, -box.min.y * k, -center.z * k)
  }, [scene])
  return (
    <group ref={root}>
      <primitive object={scene} />
    </group>
  )
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/** Applies UI commands as eased spherical moves around the product, and reports the heading back to the UI. */
function ViewerRig() {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const command = useViewerStore((s) => s.command)
  const reducedMotion = useExperienceStore((s) => s.reducedMotion)
  const anim = useRef<{ from: THREE.Spherical; to: THREE.Spherical; cur: THREE.Spherical; t: number } | null>(null)
  const tmp = useMemo(() => ({ s: new THREE.Spherical(), v: new THREE.Vector3() }), [])
  const lastHeading = useRef(-1)

  useEffect(() => {
    if (!controls || !command) return
    const cam = controls.object
    // Repeated clicks accumulate: a new move starts from the running move's current (unwrapped) state and builds on
    // its target, so start and target stay continuous however many times a button is pressed.
    const running = anim.current
    const from = running ? running.cur.clone() : new THREE.Spherical().setFromVector3(tmp.v.copy(cam.position).sub(TARGET))
    const to = running ? running.to.clone() : from.clone()
    if (command.type === 'rotate') to.theta += command.by
    if (command.type === 'zoom') to.radius = THREE.MathUtils.clamp(to.radius * command.factor, MIN_R, MAX_R)
    if (command.type === 'reset') Object.assign(to, { theta: from.theta + wrap(HOME.theta - from.theta), phi: HOME.phi, radius: HOME.radius })
    if (command.type === 'view') {
      const v = VIEWS[command.view]
      if (v.theta !== undefined) to.theta = from.theta + wrap(v.theta - from.theta) // shortest way round
      to.phi = v.phi
    }
    anim.current = { from, to, cur: from.clone(), t: 0 }
  }, [command, controls, tmp])

  useFrame((_, delta) => {
    if (!controls) return
    const a = anim.current
    if (a) {
      a.t = reducedMotion ? 1 : Math.min(1, a.t + delta / 0.7)
      const e = a.t < 0.5 ? 4 * a.t ** 3 : 1 - (-2 * a.t + 2) ** 3 / 2
      tmp.s.set(
        a.from.radius + (a.to.radius - a.from.radius) * e,
        a.from.phi + (a.to.phi - a.from.phi) * e,
        a.from.theta + (a.to.theta - a.from.theta) * e,
      )
      a.cur.copy(tmp.s)
      controls.object.position.copy(TARGET).add(tmp.v.setFromSpherical(tmp.s))
      controls.update()
      if (a.t >= 1) anim.current = null
    }
    if (process.env.NODE_ENV !== 'production') {
      ;(window as unknown as { __viewerCamera?: number[] }).__viewerCamera = [
        controls.getDistance(),
        controls.getAzimuthalAngle(),
        controls.getPolarAngle(),
      ]
    }
    const deg = Math.round(((THREE.MathUtils.radToDeg(controls.getAzimuthalAngle()) % 360) + 360) % 360)
    if (deg !== lastHeading.current) {
      lastHeading.current = deg
      useViewerStore.getState().setHeading(deg)
    }
  })
  return null
}

/** Portrait screens: widen the vertical fov so the product keeps >= ~32 deg of horizontal view (never cropped). */
function ResponsiveFov() {
  const size = useThree((s) => s.size)
  const get = useThree((s) => s.get)
  useEffect(() => {
    const cam = get().camera as THREE.PerspectiveCamera
    const aspect = size.width / Math.max(1, size.height)
    const minHalfH = THREE.MathUtils.degToRad(16)
    const halfV = Math.max(THREE.MathUtils.degToRad(15), Math.atan(Math.tan(minHalfH) / aspect))
    cam.fov = Math.min(58, THREE.MathUtils.radToDeg(2 * halfV))
    cam.updateProjectionMatrix()
  }, [get, size.width, size.height])
  return null
}

function Controls() {
  const autoRotate = useViewerStore((s) => s.autoRotate)
  const reducedMotion = useExperienceStore((s) => s.reducedMotion)
  return (
    <OrbitControls
      makeDefault
      target={TARGET}
      enablePan={false}
      enableDamping={!reducedMotion}
      dampingFactor={0.09}
      rotateSpeed={0.85}
      zoomSpeed={0.8}
      minDistance={MIN_R}
      maxDistance={MAX_R}
      minPolarAngle={0.04}
      maxPolarAngle={Math.PI / 2 + 0.06}
      autoRotate={autoRotate}
      autoRotateSpeed={1.6}
    />
  )
}

const START = new THREE.Vector3().setFromSpherical(new THREE.Spherical(HOME.radius, HOME.phi, HOME.theta)).add(TARGET)

export default function ViewerCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 30, position: START.toArray() as [number, number, number], near: 0.05, far: 60 }}
      onCreated={({ gl }) => {
        applyRenderSettings(gl)
        gl.setClearColor(0x000000, 0)
      }}
      style={{ touchAction: 'none' }}
      aria-label="Interactive 360 degree view of the INFINOS Pro Dual-Chamber Bag"
    >
      <LightingSystem />
      <Suspense fallback={null}>
        <ViewerModel />
      </Suspense>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.7} scale={8} blur={2.6} far={1.5} resolution={1024} color="#000000" />
      <Controls />
      <ResponsiveFov />
      <ViewerRig />
    </Canvas>
  )
}
