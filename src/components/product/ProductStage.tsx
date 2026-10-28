'use client'

import { useCallback, useRef } from 'react'
import { ProductScene } from './ProductScene'
import { StudioEnvironment } from './StudioEnvironment'
import { HOTSPOTS } from '@/content/hotspots'
import { useExperienceStore } from '@/state/experienceStore'

function HotspotCard() {
  const hotspot = useExperienceStore((s) => s.hotspot)
  const phase = useExperienceStore((s) => s.phase)
  const setHotspot = useExperienceStore((s) => s.setHotspot)
  const h = HOTSPOTS.find((x) => x.id === hotspot)
  const visible = phase === 'hero' && !!h
  return (
    <aside className={`hotspot-card ${visible ? 'hotspot-card--visible' : ''}`} aria-live="polite" aria-hidden={!visible}>
      {h && (
        <>
          <p className="hotspot-card-kicker">EXPLORE</p>
          <h3 className="hotspot-card-title">{h.label}</h3>
          <p className="hotspot-card-text">{h.text}</p>
          <button
            type="button"
            className="hotspot-card-close"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              setHotspot(null)
              useExperienceStore.setState({ yaw: 0 })
            }}
          >
            RESET VIEW
          </button>
        </>
      )}
    </aside>
  )
}

export function ProductStage() {
  const setPointer = useExperienceStore((s) => s.setPointer)
  const phase = useExperienceStore((s) => s.phase)
  const drag = useRef<{ x: number; id: number } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (useExperienceStore.getState().phase !== 'hero') return
    drag.current = { x: e.clientX, id: e.pointerId }
  }, [])
  const onPointerUp = useCallback(() => {
    drag.current = null
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -((e.clientY / window.innerHeight) * 2 - 1)
      setPointer(x, y)
      const st = useExperienceStore.getState()
      if (drag.current && st.phase === 'hero') {
        const dx = e.clientX - drag.current.x
        drag.current.x = e.clientX
        if (Math.abs(dx) > 0 && st.hotspot) st.setHotspot(null)
        const yaw = st.yaw + dx * 0.008
        useExperienceStore.setState({ yaw: Math.max(-Math.PI, Math.min(Math.PI, yaw)) })
      }
    },
    [setPointer],
  )

  return (
    <div
      className="stage"
      id="narrative"
      data-phase={phase}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <StudioEnvironment />
      <ProductScene />
      <p className={`rotate-hint ${phase === 'hero' ? 'rotate-hint--visible' : ''}`} aria-hidden="true">
        DRAG TO ROTATE · TAP A MARKER TO EXPLORE
      </p>
      <HotspotCard />
    </div>
  )
}
