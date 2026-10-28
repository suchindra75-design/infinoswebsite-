'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls, useGLTF } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { LightingSystem } from '@/components/product/LightingSystem'
import { applyRenderSettings } from '@/components/product/renderSettings'
import { PRODUCT } from '@/content/products'
import { layerPose } from '@/motion/pose'
import { SEQUENCES, sequenceStages } from '@/motion/sequences'

type Vec3 = [number, number, number]
type Cam = { pos: Vec3; target: Vec3; fov?: number }
/** open = progress through the opening sequence (0 closed .. 1 box out with lid open), as on the site */
type Pose = { open: number; exploded: number }

/** Approximate viewpoints of the reference photographs (world units after the site's 1.8 auto-scale). */
const VIEWS: Record<string, Cam> = {
  front: { pos: [0, 1.15, 5.6], target: [0, 0.9, 0], fov: 30 },
  side_px: { pos: [5.4, 0.95, -0.05], target: [0, 0.85, -0.05], fov: 30 },
  side_mx: { pos: [-5.4, 0.95, -0.05], target: [0, 0.85, -0.05], fov: 30 },
  back: { pos: [0, 0.9, -5.6], target: [0, 0.9, 0], fov: 30 },
  three_q: { pos: [-3.4, 1.9, 4.4], target: [0, 0.85, 0], fov: 30 },
  top_open: { pos: [0, 4.6, 2.6], target: [0, 1.1, 0], fov: 30 },
  box_out: { pos: [1.3, 2.6, 4.8], target: [0, 0.55, 0.8], fov: 30 },
}

declare global {
  interface Window {
    __review?: {
      setView: (name: string) => void
      setCamera: (c: Cam) => void
      setPose: (p: Partial<Pose>) => void
      load: (src: string) => void
      setRender: (r: { exposure?: number; toneMapping?: 'aces' | 'agx' | 'neutral' }) => void
      info: () => unknown
    }
  }
}

/** written by the loaded model, read by window.__review.info() */
const reviewInfo: { current: unknown } = { current: null }

function useReviewApi(setSrc: (s: string) => void, pose: React.MutableRefObject<Pose>) {
  const get = useThree((s) => s.get)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  useEffect(() => {
    const camera = get().camera as THREE.PerspectiveCamera
    const gl = get().gl
    const setCamera = (c: Cam) => {
      camera.position.set(...c.pos)
      camera.fov = c.fov ?? 30
      camera.updateProjectionMatrix()
      if (controls) {
        controls.target.set(...c.target)
        controls.update()
      } else camera.lookAt(...c.target)
    }
    window.__review = {
      setView: (name) => VIEWS[name] && setCamera(VIEWS[name]),
      setCamera,
      setPose: (p) => Object.assign(pose.current, p),
      load: setSrc,
      setRender: ({ exposure, toneMapping }) => {
        if (exposure !== undefined) gl.toneMappingExposure = exposure
        if (toneMapping)
          gl.toneMapping = { aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping, neutral: THREE.NeutralToneMapping }[toneMapping]
      },
      info: () => reviewInfo.current,
    }
  }, [get, controls, setSrc, pose])
}

function Model({ src, pose }: { src: string; pose: React.MutableRefObject<Pose> }) {
  const gltf = useGLTF(src)
  const scene = useMemo(() => gltf.scene.clone(true), [gltf])
  const root = useRef<THREE.Group>(null!)
  const rest = useRef(new Map<THREE.Object3D, { p: THREE.Vector3; r: THREE.Euler }>())

  useEffect(() => {
    const debug = new URLSearchParams(window.location.search).get('debug')
    const debugNormals = debug === 'normals'
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      if (debugNormals) m.material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })
      else
        for (const mat of [m.material].flat()) {
          const std = mat as THREE.MeshStandardMaterial
          std.fog = false
          if (debug === 'nonormalmap' && std.normalMap) { std.normalMap = null; std.needsUpdate = true }
        }
    })
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
    rest.current.clear()
    for (const spec of PRODUCT.modelComponents) {
      const node = scene.getObjectByName(spec.nodeName)
      if (node) rest.current.set(node, { p: node.position.clone(), r: node.rotation.clone() })
    }
    let tris = 0
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3
    })
    reviewInfo.current = { src, sizeModel: size.toArray(), autoScale: k, tris, nodes: [...rest.current.keys()].map((n) => n.name) }
    return () => {
      reviewInfo.current = null
    }
  }, [scene, src])

  const tmp = useMemo(() => ({ p: new THREE.Vector3(), r: new THREE.Vector3() }), [])
  useFrame(() => {
    const { open, exploded } = pose.current
    const stages = sequenceStages(SEQUENCES.open, open)
    for (const spec of PRODUCT.modelComponents) {
      const node = scene.getObjectByName(spec.nodeName)
      const r = node && rest.current.get(node)
      if (!node || !r) continue
      layerPose(spec, stages, exploded, 1, r.p, r.r, tmp.p, tmp.r)
      node.position.copy(tmp.p)
      node.rotation.set(tmp.r.x, tmp.r.y, tmp.r.z)
    }
  })

  return (
    <group ref={root}>
      <primitive object={scene} />
    </group>
  )
}

function Scene({ src, setSrc }: { src: string; setSrc: (s: string) => void }) {
  const pose = useRef<Pose>({ open: 0, exploded: 0 })
  useReviewApi(setSrc, pose)
  return (
    <>
      <LightingSystem />
      <Suspense fallback={null}>
        <Model key={src} src={src} pose={pose} />
      </Suspense>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.002, 0]}>
        <circleGeometry args={[14, 96]} />
        <meshStandardMaterial color="#cfc9bf" roughness={0.7} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.6} scale={7} blur={2.6} far={1.6} resolution={1024} />
      <OrbitControls makeDefault target={[0, 0.9, 0]} />
    </>
  )
}

export default function ModelReview() {
  const query = useSearchParams().get('src')
  const [override, setSrc] = useState<string | null>(null)
  const src = override ?? query ?? PRODUCT.model.source ?? '/models/t1.glb'
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#d9d4cc' }}>
      <Canvas
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        camera={{ fov: 30, position: VIEWS.front.pos, near: 0.05, far: 60 }}
        onCreated={({ gl }) => applyRenderSettings(gl)}
      >
        <Scene src={src} setSrc={setSrc} />
      </Canvas>
      <p style={{ position: 'absolute', left: 12, bottom: 10, font: '11px monospace', color: '#333' }}>{src}</p>
    </div>
  )
}
