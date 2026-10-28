import { gsap } from 'gsap'
import { useExperienceStore } from '@/state/experienceStore'

/**
 * ONE frame loop for everything that draws per frame (gsap's ticker, the same requestAnimationFrame that runs Lenis).
 *
 * Order inside a single animation frame:
 *   1. Lenis.raf (prioritised in SmoothScrollProvider) -> ScrollTrigger.update -> applyScrollProgress -> store
 *   2. this loop: the editorial overlay (DOM), the photoreal frame canvas (2D) and the live 3D scene (WebGL)
 * so text, frames and model always show the same scroll position in the same frame — no layer lags a frame behind.
 *
 * Nothing renders unless something changed: a store update or an explicit requestFrame() marks the loop dirty; a
 * renderer that is still easing (e.g. the hero drag inertia) returns true to ask for one more frame. When the page is
 * idle the loop does no work at all.
 */
export type Renderer = (now: number) => boolean | void

interface Entry {
  order: number
  fn: Renderer
}

const entries: Entry[] = []
let dirty = true
let started = false

export function requestFrame() {
  dirty = true
}

/** one render of the live 3D scene even while it is hidden (shader compile / texture upload before it is needed) */
export const warmUp = { pending: false }
export function requestWarmRender() {
  warmUp.pending = true
  dirty = true
}

function tick() {
  if (!dirty) return
  dirty = false
  const now = performance.now()
  for (const e of entries) if (e.fn(now)) dirty = true
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  gsap.ticker.add(tick)
  // any store change (scroll progress, phase, viewport, model ready, ...) needs a redraw
  useExperienceStore.subscribe(requestFrame)
  window.addEventListener('resize', requestFrame)
}

/** Register a renderer; lower `order` runs first (overlay 10, frames 20, 3D 30). Returns an unregister function. */
export function addRenderer(fn: Renderer, order: number): () => void {
  start()
  const entry = { fn, order }
  entries.push(entry)
  entries.sort((a, b) => a.order - b.order)
  dirty = true
  return () => {
    const i = entries.indexOf(entry)
    if (i >= 0) entries.splice(i, 1)
  }
}
