'use client'

import dynamic from 'next/dynamic'
import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { COOLANTS, COOLANT_FAMILY, COOLANT_STILLS } from '@/content/coolants'
import { useExperienceStore } from '@/state/experienceStore'
import { addRenderer, requestFrame } from '@/motion/frameLoop'
import { COVER_FROM, INFO_FROM, RETURN_BELOW, backdropAt, direction, familyAt, pickerAt, poolAt } from '@/motion/coolantMotion'
import { setStageCovered } from '@/motion/stageCover'
import { coolantRuntime as rt, measureSection, sectionScroll, useCoolantStore } from './coolantStore'
import { CoolantInfo } from './CoolantInfo'

const CoolantCanvas = dynamic(() => import('./CoolantCanvas').then((m) => m.CoolantCanvas), { ssr: false })

/** a failed model load (or WebGL loss) shows the still image instead of an empty stage */
class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** without WebGL: a still of the fan, following the selection (each variant pulled forward, rendered from the scene) */
function Still() {
  const selected = useCoolantStore((s) => s.selected)
  const name = COOLANTS.find((c) => c.id === selected)?.name
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="cx-still"
      src={COOLANT_STILLS[selected ?? 'family']}
      alt={name ? `The three INFINOS coolant packs, ${name.toLowerCase()} pulled forward` : 'The three INFINOS coolant packs — organic, inorganic and eutectic — fanned out like playing cards'}
      width={1600}
      height={1000}
      loading="lazy"
    />
  )
}

/**
 * Coolant showcase: the section overlaps the narrative's last screen, so its full-screen stage is already pinned when
 * the bag story completes. The studio backdrop then dissolves in over the bag, a pool of light opens, and the three
 * coolant packs are laid into a fan like playing cards; any pack can then be pulled forward. Once the fan is complete,
 * the family introduction and the selected coolant's verified information appear (CoolantInfo); the packs themselves
 * carry no labels — the three names are on the selector.
 * The canvas mounts in idle time after the intro (so model loading, WebGL set-up and shader compilation never land
 * on the transition itself) and renders only while the section is on screen.
 */
export function CoolantShowcase() {
  const ref = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const backdrop = useRef<HTMLDivElement>(null)
  const pool = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLDivElement>(null)
  const picker = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const webgl = useExperienceStore((s) => s.webglSupported)
  const isMobile = useExperienceStore((s) => s.isMobile)
  const reducedMotion = useExperienceStore((s) => s.reducedMotion)
  const introReady = useExperienceStore((s) => s.introPhase === 'ready')
  const selected = useCoolantStore((s) => s.selected)
  const hovered = useCoolantStore((s) => s.hovered)
  const toggle = useCoolantStore((s) => s.toggle)
  const hover = useCoolantStore((s) => s.hover)

  useEffect(() => {
    rt.reducedMotion = reducedMotion
    rt.dirty = true
    requestFrame()
  }, [reducedMotion])

  // mount early, in an idle moment after the intro: the visitor is usually still on the hero, and everything is ready
  // long before the bag story ends
  useEffect(() => {
    if (!introReady || mounted) return
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
    const t = window.setTimeout(() => {
      if (w.requestIdleCallback) w.requestIdleCallback(() => setMounted(true), { timeout: 4000 })
      else setMounted(true)
    }, 1200)
    return () => window.clearTimeout(t)
  }, [introReady, mounted])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    rt.section = el
    measureSection()
    // the stage is hidden under the opaque backdrop from COVER_FROM on — decided on every scroll, not only while the
    // section is on screen, so a jump back to the story always uncovers it
    const cover = () => setStageCovered(sectionScroll() >= COVER_FROM)
    const remeasure = () => {
      measureSection()
      cover()
      rt.dirty = true
      requestFrame()
    }
    cover()
    // fallback: if the idle mount has not happened yet, mount when the section is near
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setMounted(true), { rootMargin: '150% 0px' })
    const onScreen = new IntersectionObserver(
      ([e]) => {
        rt.visible = e.isIntersecting
        rt.dirty = true
        requestFrame()
      },
      { rootMargin: '5% 0px' },
    )
    near.observe(el)
    onScreen.observe(el)
    const resized = new ResizeObserver(remeasure)
    resized.observe(el)
    const onScroll = () => {
      cover()
      if (rt.visible) requestFrame()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', remeasure)
    return () => {
      near.disconnect()
      onScreen.disconnect()
      resized.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', remeasure)
      setStageCovered(false)
      rt.section = null
      rt.visible = false
    }
  }, [])

  // the stage's DOM layers follow the same scroll timeline, written from the shared frame loop (before the 3D canvas)
  useEffect(() => {
    let last = ''
    let prevS = Number.NaN
    return addRenderer(() => {
      if (!rt.visible) return
      const s = sectionScroll()
      // scrolling back above the completed fan restores the family view (a pulled-forward pack never mixes with
      // the reversed dealing)
      const { selected, select } = useCoolantStore.getState()
      if (selected && prevS >= RETURN_BELOW && s < RETURN_BELOW) select(null)
      prevS = s
      const b = backdropAt(s)
      const p = pickerAt(s)
      const active = s >= COVER_FROM
      const family = familyAt(s)
      // a selected coolant's information opens only once all three packs have landed
      const focus = !!useCoolantStore.getState().selected && s >= INFO_FROM
      const key = `${b.toFixed(3)}|${poolAt(s).toFixed(3)}|${p.toFixed(3)}|${s >= -0.01}|${active}|${family.toFixed(3)}|${focus}|${useCoolantStore.getState().selected}`
      if (key === last) return
      last = key
      if (stage.current) {
        stage.current.style.setProperty('--cx-family', family.toFixed(3))
        stage.current.dataset.focus = String(focus)
        stage.current.dataset.selected = useCoolantStore.getState().selected ?? ''
      }
      if (backdrop.current) backdrop.current.style.opacity = String(b)
      if (pool.current) pool.current.style.opacity = String(poolAt(s))
      // nothing of the showcase is visible (or clickable) before the bag story completes
      if (canvas.current) canvas.current.style.visibility = s >= -0.01 ? 'visible' : 'hidden'
      if (picker.current) {
        picker.current.style.opacity = String(p)
        picker.current.dataset.on = String(p > 0.5)
      }
      // the packs become clickable only once the story has fully dissolved: its buttons work until they are gone
      if (stage.current) stage.current.dataset.active = String(active)
    }, 39)
  }, [])

  // buttons (mouse, touch, keyboard) and the 3D picks share one state; the scene eases toward it
  useEffect(() => {
    rt.dirty = true
    requestFrame()
  }, [selected, hovered])

  // Esc returns to the family view while the section is on screen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !rt.visible || !useCoolantStore.getState().selected) return
      useCoolantStore.getState().select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // the information layout per screen (refined by the 3D framing when WebGL runs; used as is without it)
  useEffect(() => {
    const layout = () => {
      const d = direction(window.innerWidth, window.innerHeight)
      if (stage.current) stage.current.dataset.focusLayout = d.focusShift > 0 ? 'column' : d.mode === 'phoneL' ? 'side' : 'bands'
    }
    layout()
    window.addEventListener('resize', layout)
    return () => window.removeEventListener('resize', layout)
  }, [])

  return (
    <section ref={ref} className="cx" id="coolants" aria-label="Coolants">
      <div className="cx-stage" ref={stage}>
        <div className="cx-backdrop" ref={backdrop} aria-hidden="true" />
        <div className="cx-pool" ref={pool} aria-hidden="true" />
        <div className="cx-canvas" ref={canvas}>
          {webgl ? (
            <Boundary fallback={<Still />}>{mounted && <CoolantCanvas isMobile={isMobile} />}</Boundary>
          ) : (
            <Still />
          )}
        </div>
        <CoolantInfo />
        <div className="cx-picker" ref={picker} role="group" aria-label="Coolants: bring one into focus">
          <p className="cx-hint" aria-hidden="true">{COOLANT_FAMILY.hint}</p>
          {COOLANTS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`cx-pick${hovered === c.id ? ' cx-pick--hover' : ''}`}
              style={{ '--cx-c': c.ui } as React.CSSProperties}
              aria-pressed={selected === c.id}
              onClick={() => toggle(c.id)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && hover(c.id)}
              onPointerLeave={() => hover(null)}
            >
              <i className="cx-swatch" aria-hidden="true" />
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
