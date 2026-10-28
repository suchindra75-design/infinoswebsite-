'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { PRODUCT } from '@/content/products'
import { registerProductComponent, unregisterProductComponent } from './ProductComponentRegistry'
import { LayerLabel } from './ComponentLabels'
import { sensorTarget } from './TelemetryVisualization'
import { Hotspots } from './Hotspots'
import { useExperienceStore } from '@/state/experienceStore'
import { requestWarmRender } from '@/motion/frameLoop'

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

function ProductModelInner() {
  const source = PRODUCT.model.source as string
  const gltf = useGLTF(source)
  const cloned = useMemo(() => gltf.scene.clone(true), [gltf])
  const rootRef = useRef<THREE.Group>(null!)
  const wrapperRefs = useRef(new Map<string, THREE.Group>())
  const restRef = useRef(new Map<string, { pos: THREE.Vector3; rot: THREE.Euler }>())
  const [labelOffset, setLabelOffset] = useState(0.95)
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy())
    cloned.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      // casts onto the studio floor (ShadowCatcher); receiveShadow stays off, so the product's own shading is untouched
      mesh.castShadow = true
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const std = m as THREE.MeshStandardMaterial
        std.fog = false // the product is never fogged; only the studio floor fades into the background
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
    useExperienceStore.setState({ modelReady: true })
    // render once now so shaders compile and textures upload while the reveal frames still cover the canvas, instead
    // of at the cross-fade
    requestWarmRender()

    return () => {
      for (const spec of PRODUCT.modelComponents) unregisterProductComponent(spec.id)
      sensorTarget.current = null
      useExperienceStore.setState({ modelReady: false })
    }
  }, [cloned])

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
