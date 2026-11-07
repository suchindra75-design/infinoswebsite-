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

/**
 * The small viewport height (100svh: the visible height with the browser's bars shown) in CSS px. The fixed story
 * overlay follows the visible viewport, so on a phone its bottom-anchored chapter text is highest when the address
 * bar is shown; the phone composition keeps the product above that position, so the two never meet whatever the bars
 * do. Measured from a probe element and cached; it changes only with the window size, never while scrolling.
 */
const small = { H: 0, observed: false }
export function smallViewportHeight(): number {
  if (typeof window === 'undefined') return 0
  if (!small.observed && document.body) {
    small.observed = true
    const probe = document.createElement('div')
    probe.setAttribute('aria-hidden', 'true')
    probe.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:100vh;height:100svh;visibility:hidden;pointer-events:none;'
    document.body.appendChild(probe)
    small.H = probe.getBoundingClientRect().height
    new ResizeObserver(([e]) => {
      small.H = e.contentRect.height
    }).observe(probe)
  }
  return small.H || window.innerHeight
}
