import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { ProductComponentSpec } from '@/content/products'

export interface RegisteredProductComponent {
  id: string
  object: THREE.Object3D
  basePosition: THREE.Vector3
  baseRotation: THREE.Euler
  spec: ProductComponentSpec
}

const registry = new Map<string, RegisteredProductComponent>()

export function registerProductComponent(entry: RegisteredProductComponent) {
  registry.set(entry.id, entry)
}

export function unregisterProductComponent(id: string) {
  registry.delete(id)
}

export function getRegisteredComponents(): RegisteredProductComponent[] {
  return Array.from(registry.values())
}

export function getRegisteredComponent(id: string): RegisteredProductComponent | undefined {
  return registry.get(id)
}

export function clearProductComponents() {
  registry.clear()
}

export function useRegisterComponent(spec: ProductComponentSpec) {
  const ref = useRef<THREE.Group>(null!)

  useEffect(() => {
    const object = ref.current
    if (!object) return
    registerProductComponent({
      id: spec.id,
      object,
      basePosition: new THREE.Vector3(...spec.basePosition),
      baseRotation: new THREE.Euler(),
      spec,
    })
    return () => unregisterProductComponent(spec.id)
  }, [spec])

  return ref
}
