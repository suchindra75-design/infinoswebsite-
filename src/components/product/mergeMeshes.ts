import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Fewer draw calls for the product, with the same pixels.
 *
 * The bag's glTF has 116 meshes (122 primitives) in ten parts that move independently (flap, lids, panels, inner box,
 * rack, straps...). Every scrolled frame of the live chapters drew each one separately — for the camera and again for
 * the floor shadows — and that per-draw overhead was the largest single cost of the story on a phone. Within a part
 * nothing moves relative to anything else, so all its meshes that share a material (and vertex layout) are merged
 * into one mesh, in the part's own space. The parts themselves stay separate nodes with their names, so the opening
 * stages, the exploded view, the labels and the hotspots work exactly as before.
 *
 * Runs once on the product's private clone: the cached glTF (shared with the 360° viewer) is never modified.
 */

/** float copies of every attribute (the file is quantized: int16 / int8 attributes with per-node scale) */
function floatGeometry(src: THREE.BufferGeometry): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  for (const name of Object.keys(src.attributes)) {
    const a = src.attributes[name] as THREE.BufferAttribute | THREE.InterleavedBufferAttribute
    const n = a.count
    const size = a.itemSize
    const out = new Float32Array(n * size)
    for (let i = 0; i < n; i++) {
      // getX..getW de-normalize normalized integer attributes
      out[i * size] = a.getX(i)
      if (size > 1) out[i * size + 1] = a.getY(i)
      if (size > 2) out[i * size + 2] = a.getZ(i)
      if (size > 3) out[i * size + 3] = a.getW(i)
    }
    geo.setAttribute(name, new THREE.BufferAttribute(out, size))
  }
  if (src.index) geo.setIndex(Array.from(src.index.array as ArrayLike<number>))
  return geo
}

/** a mirrored transform reverses the triangles' winding: restore it so face culling and normals stay correct */
function flipWinding(geo: THREE.BufferGeometry) {
  const index = geo.index
  if (index) {
    const a = index.array as Uint16Array | Uint32Array
    for (let i = 0; i + 2 < a.length; i += 3) {
      const t = a[i + 1]
      a[i + 1] = a[i + 2]
      a[i + 2] = t
    }
    index.needsUpdate = true
    return
  }
  for (const name of Object.keys(geo.attributes)) {
    const attr = geo.attributes[name] as THREE.BufferAttribute
    const s = attr.itemSize
    const arr = attr.array as Float32Array
    for (let v = 0; v + 2 < attr.count; v += 3)
      for (let k = 0; k < s; k++) {
        const t = arr[(v + 1) * s + k]
        arr[(v + 1) * s + k] = arr[(v + 2) * s + k]
        arr[(v + 2) * s + k] = t
      }
  }
}

export function mergePartMeshes(root: THREE.Object3D, partNames: string[]): { before: number; after: number } {
  root.updateMatrixWorld(true)
  const wanted = new Set(partNames.map((n) => n.toLowerCase()))
  const parts: THREE.Object3D[] = []
  root.traverse((o) => {
    if (wanted.has(o.name.toLowerCase())) parts.push(o)
  })

  let before = 0
  let after = 0
  const inverse = new THREE.Matrix4()
  const relative = new THREE.Matrix4()

  for (const part of parts) {
    inverse.copy(part.matrixWorld).invert()
    const groups = new Map<string, { material: THREE.Material; meshes: THREE.Mesh[] }>()
    part.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh || Array.isArray(mesh.material) || (mesh as THREE.SkinnedMesh).isSkinnedMesh) return
      if (Object.keys(mesh.geometry.morphAttributes).length) return
      const g = mesh.geometry
      const key = `${mesh.material.uuid}|${Object.keys(g.attributes).sort().join(',')}|${g.index ? 'i' : 'n'}|${mesh.renderOrder}`
      const entry = groups.get(key) ?? { material: mesh.material, meshes: [] }
      entry.meshes.push(mesh)
      groups.set(key, entry)
    })

    for (const { material, meshes } of groups.values()) {
      before += meshes.length
      if (meshes.length < 2) {
        after += 1
        continue
      }
      const geometries = meshes.map((mesh) => {
        const geo = floatGeometry(mesh.geometry)
        relative.multiplyMatrices(inverse, mesh.matrixWorld)
        geo.applyMatrix4(relative)
        if (relative.determinant() < 0) flipWinding(geo)
        return geo
      })
      const merged = mergeGeometries(geometries, false)
      geometries.forEach((g) => g.dispose())
      if (!merged) {
        after += meshes.length
        continue
      }
      merged.computeBoundingBox()
      merged.computeBoundingSphere()
      const mesh = new THREE.Mesh(merged, material)
      mesh.name = `${part.name}__${material.name || 'merged'}`
      mesh.renderOrder = meshes[0].renderOrder
      for (const m of meshes) m.removeFromParent()
      part.add(mesh)
      after += 1
    }
  }

  // empty transform nodes left behind by the merge are harmless; drop them to keep traversals short
  for (const part of parts) {
    const empties: THREE.Object3D[] = []
    part.traverse((o) => {
      if (o !== part && !(o as THREE.Mesh).isMesh && o.children.length === 0) empties.push(o)
    })
    for (const e of empties) e.removeFromParent()
  }
  return { before, after }
}
