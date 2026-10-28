'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { PRODUCT, type ProductComponentSpec } from '@/content/products'
import { useRegisterComponent } from './ProductComponentRegistry'
import { LayerLabel, DisplayReadout } from './ComponentLabels'
import { sensorTarget } from './TelemetryVisualization'

const SHELL_COLOR = '#1b1f26'
const DARK_METAL = '#20242c'
const INSULATION = '#3a3f47'
const PAYLOAD = '#232830'
const SENSOR = '#2b3038'

function LayerGeometry({ id }: { id: string }) {
  switch (id) {
    case 'lid':
      return (
        <RoundedBox args={[1.56, 0.22, 1.01]} radius={0.045} smoothness={4}>
          <meshStandardMaterial color="#171a20" roughness={0.4} metalness={0.2} />
        </RoundedBox>
      )
    case 'outerShell':
      return (
        <>
          <RoundedBox args={[1.5, 1.7, 0.95]} radius={0.06} smoothness={4}>
            <meshStandardMaterial color={SHELL_COLOR} roughness={0.45} metalness={0.15} />
          </RoundedBox>
          <mesh position={[0, 1.2, 0.482]}>
            <planeGeometry args={[0.52, 0.3]} />
            <meshBasicMaterial color="#05070a" />
          </mesh>
        </>
      )
    case 'insulation':
      return (
        <RoundedBox args={[1.38, 0.1, 0.85]} radius={0.02} smoothness={3}>
          <meshStandardMaterial color={INSULATION} roughness={0.85} metalness={0} />
        </RoundedBox>
      )
    case 'payload':
      return (
        <RoundedBox args={[1.25, 0.5, 0.78]} radius={0.03} smoothness={3}>
          <meshStandardMaterial color={PAYLOAD} roughness={0.6} metalness={0.05} />
        </RoundedBox>
      )
    case 'sensor':
      return (
        <>
          <RoundedBox args={[0.36, 0.14, 0.24]} radius={0.02} smoothness={3}>
            <meshStandardMaterial color={SENSOR} roughness={0.5} metalness={0.3} />
          </RoundedBox>
          <mesh position={[0.1, 0.078, 0]}>
            <sphereGeometry args={[0.028, 16, 16]} />
            <meshStandardMaterial
              ref={(m) => {
                if (m) sensorTarget.current = m as THREE.MeshStandardMaterial
              }}
              color="#0a0d12"
              emissive="#5aa5d6"
              emissiveIntensity={0.15}
              roughness={0.2}
              metalness={0.4}
            />
          </mesh>
        </>
      )
    case 'thermal':
      return (
        <RoundedBox args={[1.2, 0.06, 0.7]} radius={0.015} smoothness={3}>
          <meshStandardMaterial
            color={DARK_METAL}
            roughness={0.35}
            metalness={0.5}
          />
        </RoundedBox>
      )
    case 'electronics':
      return (
        <>
          <RoundedBox args={[0.72, 0.2, 0.42]} radius={0.02} smoothness={3}>
            <meshStandardMaterial color={DARK_METAL} roughness={0.45} metalness={0.35} />
          </RoundedBox>
          <mesh position={[0, 0.105, 0]}>
            <boxGeometry args={[0.5, 0.012, 0.26]} />
            <meshStandardMaterial color="#14202c" roughness={0.6} metalness={0.1} />
          </mesh>
        </>
      )
    default:
      return null
  }
}

function LayerGroup({ spec }: { spec: ProductComponentSpec }) {
  const ref = useRegisterComponent(spec)

  return (
    <group ref={ref} position={spec.basePosition}>
      <LayerGeometry id={spec.id} />
      <LayerLabel id={spec.id} label={spec.label} side={spec.labelSide} />
    </group>
  )
}

export function PlaceholderProduct() {
  const root = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (!root.current) return
    const t = 1 - Math.pow(0.002, delta)
    root.current.scale.x += (1 - root.current.scale.x) * t
    root.current.scale.y += (1 - root.current.scale.y) * t
    root.current.scale.z += (1 - root.current.scale.z) * t
  })

  return (
    <group ref={root} scale={0.94}>
      {PRODUCT.components.map((spec) => (
        <LayerGroup key={spec.id} spec={spec} />
      ))}
      <DisplayReadout />
    </group>
  )
}
