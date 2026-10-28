'use client'

import { Html } from '@react-three/drei'
import { htmlPortal } from '@/components/sequence/ImageSequence'
import { PRODUCT } from '@/content/products'
import { useExperienceStore } from '@/state/experienceStore'

export function LayerLabel({
  id,
  label,
  side,
  offsetX = 0.95,
}: {
  id: string
  label: string
  side: 'left' | 'right'
  offsetX?: number
}) {
  // boolean selector: re-renders when the labels show or hide, not on every frame of the exploded animation
  const visible = useExperienceStore((s) => s.phase === 'overview' && s.explodedAmount > 0.72)
  const isMobile = useExperienceStore((s) => s.isMobile)

  const keyLabels = isMobile ? ['upper', 'lower', 'innerBox'] : null
  if (keyLabels && !keyLabels.includes(id)) return null
  // narrow phone stage: the exploded stack sits left of centre, so every label goes on the right where there is room
  const labelSide = isMobile ? 'right' : side

  return (
    <Html
      portal={htmlPortal}
      position={[labelSide === 'left' ? -offsetX : offsetX, 0, 0]}
      center
      wrapperClass="layer-label-html"
      zIndexRange={[10, 0]}
    >
      <div className={`layer-label layer-label--${labelSide}`} style={{ opacity: visible ? 1 : 0 }}>
        <span className="layer-label-rule" />
        <span className="layer-label-text">{label}</span>
      </div>
    </Html>
  )
}

export function DisplayReadout() {
  const phase = useExperienceStore((s) => s.phase)
  const reading = PRODUCT.displayReading.value
  const anchor = PRODUCT.model.display.anchor
  const active = phase !== 'intro'

  return (
    <Html portal={htmlPortal} position={anchor} transform wrapperClass="display-html" zIndexRange={[10, 0]}>
      <div className="display-chip" style={{ opacity: active ? 1 : 0 }}>
        <span className="display-chip-value">{reading}</span>
        <span className="display-chip-unit">°C</span>
      </div>
    </Html>
  )
}
