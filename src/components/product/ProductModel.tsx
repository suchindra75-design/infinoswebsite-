'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { PRODUCT } from '@/content/products'
import { mergePartMeshes } from './mergeMeshes'
import { registerProductComponent, unregisterProductComponent } from './ProductComponentRegistry'
import { LayerLabel } from './ComponentLabels'
import { sensorTarget } from './TelemetryVisualization'
import { Hotspots } from './Hotspots'
import { useExperienceStore } from '@/state/experienceStore'
import { liveScene, requestWarmRender } from '@/motion/frameLoop'
import { useScrollIdle, whenScrollIdle } from '@/motion/scrollIdle'

function findNodeByName(root: THREE.Object3D, nodeName: string): THREE.Object3D | null {
  const target = nodeName.toLowerCase()
  let found: THREE.Object3D | null = null
  root.traverse((o) => {
    if (!found && o.name.toLowerCase() === target) found = o
  })
  return found
}

function findMeshMaterial(object: THREE.Object3D): THREE.MeshStandardMaterial | null {
  let material: THREE.MeshStandardMaterial | null = null
  object.traverse((o) => {
    if (!material && (o as THREE.Mesh).isMesh) {
      const m = (o as THREE.Mesh).material
      material = (Array.isArray(m) ? m[0] : m) as THREE.MeshStandardMaterial
    }
  })
  return material
}

function findMaterialByName(object: THREE.Object3D, name: string): THREE.MeshStandardMaterial | null {
  let material: THREE.MeshStandardMaterial | null = null
  object.traverse((o) => {
    if (material || !(o as THREE.Mesh).isMesh) return
    const m = (o as THREE.Mesh).material
    for (const candidate of Array.isArray(m) ? m : [m]) {
      if (candidate.name === name) material = candidate as THREE.MeshStandardMaterial
    }
  })
  return material
}

/** parts that sit inside or against a shell, within its silhouette (see the shadow casters below) */
const INNER_PARTS = /Zipper_|Screws|Velcro|Underside|Lining|Liner|_Pad_|Cable|BayItem/

/**
 * The file is downloaded and parsed first (suspends); the private clone and the merge below (a ~240 ms task on a
 * throttled phone) wait for a pause in the visitor's scrolling on touch screens (motion/scrollIdle.ts).
 */
function ProductModelInner() {
  useGLTF(PRODUCT.model.source as string)
  const idle = useScrollIdle()
  return idle ? <ProductModelBody /> : null
}

function ProductModelBody() {
  const source = PRODUCT.model.source as string
  const gltf = useGLTF(source)
  // a private clone with each part's same-material meshes merged into one draw (mergeMeshes.ts)
  const cloned = useMemo(() => {
    const c = gltf.scene.clone(true)
    const { before, after } = mergePartMeshes(c, PRODUCT.modelComponents.map((s) => s.nodeName))
    if (process.env.NODE_ENV !== 'production') console.info(`[product] draws per pass: ${before} -> ${after}`)
    return c
  }, [gltf])
  const rootRef = useRef<THREE.Group>(null!)
  const wrapperRefs = useRef(new Map<string, THREE.Group>())
  const restRef = useRef(new Map<string, { pos: THREE.Vector3; rot: THREE.Euler }>())
  const [labelOffset, setLabelOffset] = useState(0.95)
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy())
    // Shadow casters: the floor shadow (ShadowCatcher) is a very soft variance shadow, so only the bag's shells shape
    // it. Surface decals (transparent: stitching, embroidery, emblems, mesh), small parts (badges, the screen, pulls,
    // tags) and what sits inside or against a shell (linings, pads, zippers, velcro, the flap's underside, the cable and
    // bay item) stay inside the silhouette of the part they belong to — yet each was one more draw in a shadow pass that
    // re-renders on almost every frame of the exploded chapters (traced on a throttled phone: ~75 of ~140 draws per
    // frame). 58 casters -> 19; screenshots of chapters 0.30-0.74 with all 58 differ by a few faint pixels at most.
    // (ContactShadows' depth pass still draws every part: it is darkest where a part nears the floor, and leaving out
    // even the decals — the inner box's mesh divider sits low — visibly lightened it under the inner box.)
    // Sizes are measured in the model's own space.
    const whole = new THREE.Box3().setFromObject(cloned).getSize(new THREE.Vector3())
    const wholeMax = Math.max(whole.x, whole.y, whole.z) || 1
    const part = new THREE.Box3()
    const partSize = new THREE.Vector3()
    cloned.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      part.setFromObject(mesh).getSize(partSize)
      const small = Math.max(partSize.x, partSize.y, partSize.z) / wholeMax < 0.12
      const decal = mats.every((m) => m.transparent)
      const inner = INNER_PARTS.test(mesh.name)
      // casts onto the studio floor (ShadowCatcher); receiveShadow stays off, so the product's own shading is untouched
      mesh.castShadow = !small && !decal && !inner
      for (const m of mats) {
        const std = m as THREE.MeshStandardMaterial
        std.fog = false // the product is never fogged; only the studio floor fades into the background
        // Transparent + double-sided (the stitching, embroidery, emblem and mesh decals): three.js would draw these in
        // two passes, back faces then front faces, and flag the material changed before each one (needsUpdate), so every
        // frame re-derived their shader programs (~12 % of the story's CPU time on a throttled phone profile). They are
        // thin decals, so one pass draws them the same way.
        if (std.transparent && std.side === THREE.DoubleSide) std.forceSinglePass = true
        for (const tex of [std.map, std.normalMap, std.emissiveMap]) {
          if (tex) { tex.anisotropy = aniso; tex.needsUpdate = true }
        }
      }
    })
  }, [cloned, gl])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const targetHeight = PRODUCT.model.targetHeightMeters

    // Idempotent set-up (React StrictMode runs this effect twice in dev): reset to the rest pose, then measure.
    root.scale.setScalar(1)
    root.position.set(0, 0, 0)
    for (const [id, rest] of restRef.current) {
      const w = wrapperRefs.current.get(id)
      if (w) { w.position.copy(rest.pos); w.rotation.copy(rest.rot) }
    }
    root.updateWorldMatrix(true, true)
    const bbox = new THREE.Box3().setFromObject(root)
    const size = bbox.getSize(new THREE.Vector3())
    const center = bbox.getCenter(new THREE.Vector3())

    if (size.y > 0) root.scale.setScalar(targetHeight / size.y)
    root.position.set(-center.x * root.scale.x, -bbox.min.y * root.scale.y, -center.z * root.scale.z)
    root.updateWorldMatrix(true, true)

    const rootInverse = root.matrixWorld.clone().invert()

    for (const spec of PRODUCT.modelComponents) {
      const wrapper = wrapperRefs.current.get(spec.id)
      const node = findNodeByName(root, spec.nodeName)
      if (!wrapper || !node) continue

      if (!restRef.current.has(spec.id)) {
        const worldPos = node.getWorldPosition(new THREE.Vector3())
        const worldQuat = node.getWorldQuaternion(new THREE.Quaternion())
        const restLocal = worldPos.applyMatrix4(rootInverse)
        wrapper.position.copy(restLocal)
        wrapper.rotation.setFromQuaternion(worldQuat)
        wrapper.attach(node)
        restRef.current.set(spec.id, { pos: wrapper.position.clone(), rot: wrapper.rotation.clone() })
      }

      registerProductComponent({
        id: spec.id,
        object: wrapper,
        basePosition: wrapper.position.clone(),
        baseRotation: wrapper.rotation.clone(),
        spec,
      })

      // The display glow target is declared in the component metadata (products.ts), matched by glTF material name.
      // (No thermal glow: cooling/heating behaviour is not specified for the product.)
      const glow = spec.metadata?.glowMaterial
      if (spec.metadata?.telemetryRole === 'SOURCE') {
        const material = (glow && findMaterialByName(wrapper, glow)) || findMeshMaterial(wrapper)
        if (material) sensorTarget.current = material
      }
    }

    const finalBox = new THREE.Box3().setFromObject(root)
    // finalBox is in WORLD units but the label offset is applied in root-local (model) units -> divide by the auto-scale
    setLabelOffset(Math.max(0.6, (finalBox.max.x - finalBox.min.x) * 0.5 * 1.15) / root.scale.x)
    // development-only: the posed product parts, for QA and tools/phone_composition.mjs (stripped from production)
    if (process.env.NODE_ENV !== 'production') {
      ;(window as unknown as { __infinosParts?: () => THREE.Object3D[] }).__infinosParts = () => [...wrapperRefs.current.values()]
    }
    // Compile the product's shader programs in the background first (KHR_parallel_shader_compile, where available):
    // a plain first render makes three.js wait on the main thread until every program is compiled and linked — about
    // twenty physically based materials, which froze the intro and the first scroll for seconds on phones. Only then
    // is the model ready to stand in for the frames; it renders once, hidden under them, so textures upload before the
    // cross-fade.
    let live = true
    let cancelWarm = () => {}
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (!live) return
        liveScene.compiled = true
        // the first render uploads every texture (the longest single task of the set-up): at a pause on touch screens.
        // `modelReady` follows that render (ProductCanvasInner FrameLoopBridge), so the stage's held frame only hands
        // over to a model that is fully on the GPU.
        cancelWarm = whenScrollIdle(requestWarmRender)
      })

    return () => {
      live = false
      cancelWarm()
      liveScene.compiled = false
      liveScene.warmed = false
      for (const spec of PRODUCT.modelComponents) unregisterProductComponent(spec.id)
      sensorTarget.current = null
      useExperienceStore.setState({ modelReady: false })
    }
  }, [cloned, gl, scene, camera])

  return (
    <group ref={rootRef}>
      <primitive object={cloned} />
      <Hotspots />
      {PRODUCT.modelComponents.map((spec) => (
        <group
          key={spec.id}
          ref={(g) => {
            if (g) wrapperRefs.current.set(spec.id, g)
          }}
        >
          {spec.metadata?.hideLabel !== 'true' && <LayerLabel
            id={spec.id}
            label={spec.label}
            side={spec.labelSide}
            offsetX={labelOffset}
          />}
        </group>
      ))}
    </group>
  )
}

export { ProductModelInner as ProductModel }
