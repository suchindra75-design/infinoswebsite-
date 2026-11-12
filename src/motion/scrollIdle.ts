import { useEffect, useState } from 'react'

/**
 * Touch screens: the live model's one-time set-up (WebGL context, geometry merge, shader programs, texture uploads)
 * holds the main thread for about two seconds on a phone, in a few long tasks (traced at 4x CPU throttle: 250, 570 ms...).
 * Started on a timer after the intro, it landed on the visitor's first swipe and froze the opening frames and text
 * mid-gesture. While the model is not ready the stage holds the opening's hand-over frame (ImageSequence), so each
 * heavy step can wait for a pause instead: no finger on the screen and no scroll for IDLE_MS.
 */
export const SCROLL_IDLE_MS = 600

const touchScreen = () => typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches

let last = -Infinity
let touching = 0
let listening = false
function listen() {
  if (listening || typeof window === 'undefined') return
  listening = true
  const mark = () => {
    last = performance.now()
  }
  window.addEventListener('scroll', mark, { passive: true })
  window.addEventListener('touchstart', (e) => {
    touching = e.touches.length
    mark()
  }, { passive: true })
  window.addEventListener('touchmove', mark, { passive: true })
  const up = (e: TouchEvent) => {
    touching = e.touches.length
    mark()
  }
  window.addEventListener('touchend', up, { passive: true })
  window.addEventListener('touchcancel', up, { passive: true })
}

/** Runs `fn` once the page is at rest (touch screens; elsewhere at once). Returns a cancel function. */
export function whenScrollIdle(fn: () => void, ms = SCROLL_IDLE_MS): () => void {
  if (!touchScreen()) {
    fn()
    return () => {}
  }
  listen()
  let timer = 0
  const check = () => {
    const wait = last + ms - performance.now()
    if (!touching && wait <= 0) fn()
    else timer = window.setTimeout(check, Math.max(50, wait))
  }
  check()
  return () => window.clearTimeout(timer)
}

/** true once the page has been at rest after mount (see whenScrollIdle); stays true */
export function useScrollIdle(): boolean {
  const [idle, setIdle] = useState(() => !touchScreen())
  useEffect(() => {
    if (idle) return
    return whenScrollIdle(() => setIdle(true))
  }, [idle])
  return idle
}

/** start tracking early, so the first check knows about scrolling that happened before it */
export function trackScrollIdle() {
  if (touchScreen()) listen()
}
