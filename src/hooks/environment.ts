export function supportsWebGL(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    )
  } catch {
    return false
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px)').matches
}

/**
 * The product stage's size in CSS px. On touch screens the stage is the large viewport (globals.css), so it keeps its
 * size while the browser's address bar moves, and everything projected onto it (studio, callouts) must use the same
 * size as its canvases. Cached from a ResizeObserver, so the frame loop never forces a layout to read it.
 */
const stage = { W: 0, H: 0, observed: false }
export function stageSize(): { W: number; H: number } {
  if (typeof window === 'undefined') return { W: 0, H: 0 }
  if (!stage.observed) {
    const el = document.querySelector<HTMLElement>('.stage')
    if (el) {
      stage.observed = true
      stage.W = el.clientWidth
      stage.H = el.clientHeight
      new ResizeObserver(([e]) => {
        stage.W = e.contentRect.width
        stage.H = e.contentRect.height
      }).observe(el)
    }
  }
  return stage.W && stage.H ? stage : { W: window.innerWidth, H: window.innerHeight }
}
