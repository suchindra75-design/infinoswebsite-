/**
 * Touch screens: the live model's one-time set-up (WebGL canvas, geometry merge, the first render's texture uploads)
 * holds the main thread in a few long tasks. Started on a timer after the intro, it landed on the visitor's first
 * swipe and froze the opening frames and text in steps (owner's device video, 2026-11-12, 5.5-6.9 s). Each heavy step
 * waits for a pause in scrolling instead — but never longer than `maxWait`: the live model carries chapters 03-08 on
 * phones, so it must always arrive. (A first version waited without a deadline and, on the owner's phone, the model
 * never appeared; it was reverted.)
 *
 * Only scroll events count as activity: no touch-state tracking, which can be left "down" when a browser takes over a
 * gesture.
 */
export const SCROLL_IDLE_MS = 500

const touchScreen = () => typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches

let last = -Infinity
let listening = false
function listen() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('scroll', () => {
    last = performance.now()
  }, { passive: true })
}

/** start tracking early, so the first check knows about scrolling that happened before it */
export function trackScrollIdle() {
  if (touchScreen()) listen()
}

/**
 * Runs `fn` once there has been no scrolling for SCROLL_IDLE_MS, or after `maxWait` ms at the latest (touch screens;
 * elsewhere at once). Returns a cancel function.
 */
export function whenScrollIdle(fn: () => void, maxWait: number): () => void {
  if (!touchScreen()) {
    fn()
    return () => {}
  }
  listen()
  // a full quiet window from now on: a visitor who has not scrolled yet is often about to (the first swipe after the
  // intro), and a step that starts in that moment lands on the swipe
  const from = performance.now()
  const deadline = from + maxWait
  let timer = 0
  let done = false
  const check = () => {
    if (done) return
    const now = performance.now()
    const wait = Math.max(last, from) + SCROLL_IDLE_MS - now
    if (wait <= 0 || now >= deadline) {
      done = true
      fn()
    } else timer = window.setTimeout(check, Math.max(30, Math.min(wait, deadline - now)))
  }
  check()
  return () => {
    done = true
    window.clearTimeout(timer)
  }
}
