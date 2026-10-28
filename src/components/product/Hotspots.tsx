'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { htmlPortal } from '@/components/sequence/ImageSequence'
import { useFrame } from '@react-three/fiber'
import { HOTSPOTS, hotspotYaw, type Hotspot } from '@/content/hotspots'
import { useExperienceStore } from '@/state/experienceStore'

function Marker({ h }: { h: Hotspot }) {
  const ref = useRef<HTMLButtonElement>(null)
  const group = useRef<THREE.Group>(null)
  const tmp = useMemo(() => ({ n: new THREE.Vector3(), p: new THREE.Vector3(), c: new THREE.Vector3() }), [])
  const active = useExperienceStore((s) => s.hotspot === h.id)

  useFrame(({ camera }) => {
    const el = ref.current
    const g = group.current
    if (!el || !g) return
    const { phase, modelReady } = useExperienceStore.getState()
    // a marker is shown only while its surface faces the camera
    tmp.n.set(...h.normal).transformDirection(g.matrixWorld)
    g.getWorldPosition(tmp.p)
    const facing = tmp.n.dot(tmp.c.copy(camera.position).sub(tmp.p).normalize())
    const visible = phase === 'hero' && modelReady && facing > 0.15
    el.style.opacity = visible ? String(Math.min(1, (facing - 0.15) / 0.25)) : '0'
    el.style.pointerEvents = visible ? 'auto' : 'none'
    el.tabIndex = visible ? 0 : -1
  })

  const select = () => {
    const { hotspot, setHotspot } = useExperienceStore.getState()
    if (hotspot === h.id) {
      setHotspot(null)
      return
    }
    setHotspot(h.id)
    useExperienceStore.setState({ yaw: hotspotYaw(h) })
  }

  return (
    <group ref={group} position={h.anchor}>
      <Html portal={htmlPortal} center zIndexRange={[20, 0]} wrapperClass="hotspot-html">
        <button
          ref={ref}
          type="button"
          className={`hotspot ${active ? 'hotspot--active' : ''}`}
          aria-label={h.label}
          aria-pressed={active}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={select}
          style={{ opacity: 0 }}
        >
          <span className="hotspot-dot" />
          <span className="hotspot-label">{h.label}</span>
        </button>
      </Html>
    </group>
  )
}

/** Explore markers on the live model (hero chapter): click to turn the feature toward the camera and read about it. */
export function Hotspots() {
  return (
    <>
      {HOTSPOTS.map((h) => (
        <Marker key={h.id} h={h} />
      ))}
    </>
  )
}
