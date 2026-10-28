'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { gsap } from 'gsap'

/**
 * A slow, seamless horizontal marquee (the gallery and the ecosystem logos use one each, independently).
 *
 * - Motion is a CSS transform written straight to the track on GSAP's ticker — the same requestAnimationFrame that
 *   runs Lenis — attached only while the marquee is on screen (IntersectionObserver), so it costs nothing elsewhere
 *   and never wakes the shared 3D frame loop. React renders only when the number of copies or the pause button change.
 * - Seamless: the set is repeated as often as the viewport needs and the position wraps by exactly one set's width
 *   (measured, gap included), so the wrap is invisible. Copies are hidden from assistive technology and focus.
 * - Pauses (eased) on mouse hover, keyboard focus, press and drag, and with the pause button; drags with mouse or
 *   touch (with inertia), follows horizontal trackpad swipes, and steps one item with the buttons or arrow keys. It
 *   resumes after a short calm.
 * - prefers-reduced-motion: no drift — a native horizontal scroll row ('scroll') or a static wrapped grid ('wrap').
 * - loop={false} (the gallery): every item appears once — no copies, so nothing repeats and nothing wraps. When the
 *   items fit, they rest as a still, centred row without controls; otherwise the row glides slowly from one end to
 *   the other and back, easing into each end and resting there before it turns.
 */
export interface MarqueeItem {
  key: string
  node: React.ReactNode
}

interface MarqueeProps {
  items: MarqueeItem[]
  /** drift speed in CSS px per second (desktop; narrower screens drift a little slower) */
  speed: number
  /** accessible name of the scrolling region */
  label: string
  className?: string
  reducedLayout: 'scroll' | 'wrap'
  /** 'steps': previous / pause / next; 'pause': the pause button only */
  controls: 'steps' | 'pause'
  /** false: each item once, still when it fits, otherwise a back-and-forth glide (default: a seamless loop) */
  loop?: boolean
}

const REDUCED = '(prefers-reduced-motion: reduce)'
const subscribeReduced = (cb: () => void) => {
  const m = window.matchMedia(REDUCED)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}
const getReduced = () => window.matchMedia(REDUCED).matches
const getReducedOnServer = () => false

/** calm after an interaction before the drift resumes */
const RESUME_AFTER = 1500
const STEP_MS = 650
/** loop={false}: rest at each end before turning; the ease into an end lasts about this long (s) */
const REST_MS = 2600
const EASE_OUT_S = 2.4

interface Controller {
  step: (dir: number) => void
  setUserPaused: (paused: boolean) => void
}

export function Marquee({ items, speed, label, className, reducedLayout, controls, loop = true }: MarqueeProps) {
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, getReducedOnServer)
  const [copies, setCopies] = useState(2)
  const [fits, setFits] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const userPausedRef = useRef(false)
  const root = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLUListElement>(null)
  const controller = useRef<Controller | null>(null)
  const count = items.length

  useEffect(() => {
    const el = root.current
    const vp = viewport.current
    const tr = track.current
    if (!el || !vp || !tr || reduced || count === 0 || (!loop && fits)) return

    let period = 0 // one set's width, gap included
    let starts: number[] = [] // each item's left edge in the first set, relative to the first item
    let drift = speed
    let offset = 0 // unwrapped; the transform uses it modulo `period` (loop={false}: kept within 0…max)
    let factor = loop ? 1 : 0 // eased drift (0 = still)
    let max = 0 // loop={false}: how far the row can travel
    let heading = 1 // loop={false}: towards `max` (1) or back to 0 (-1)
    let restUntil = 0 // loop={false}: resting at an end
    const clamp = (v: number) => Math.max(0, Math.min(max, v))
    let hover = false
    let focus = false
    let drag = false
    let user = userPausedRef.current
    let calmUntil = 0
    let velocity = 0 // px/s, inertia after a drag
    let tween: { from: number; to: number; t0: number } | null = null
    let written = NaN

    const measure = () => {
      const kids = tr.children as HTMLCollectionOf<HTMLElement>
      if (!loop) {
        if (kids.length < count) return
        starts = Array.from({ length: count }, (_, i) => kids[i].offsetLeft - kids[0].offsetLeft)
        max = Math.max(0, tr.offsetWidth - vp.clientWidth)
        drift = speed * (vp.clientWidth < 700 ? 0.72 : 1)
        offset = clamp(offset)
        return
      }
      if (kids.length < 2 * count) return
      const x0 = kids[0].offsetLeft
      period = kids[count].offsetLeft - x0
      starts = Array.from({ length: count }, (_, i) => kids[i].offsetLeft - x0)
      drift = speed * (vp.clientWidth < 700 ? 0.72 : 1)
      const need = Math.max(2, Math.ceil(vp.clientWidth / Math.max(1, period)) + 1)
      if (need !== kids.length / count) setCopies(need)
    }

    const write = () => {
      const o = !loop ? clamp(offset) : period > 0 ? ((offset % period) + period) % period : 0
      if (o === written) return
      written = o
      tr.style.transform = `translate3d(${(-o).toFixed(2)}px,0,0)`
    }

    // loop={false}: towards the current end; the speed eases out over the last stretch (about EASE_OUT_S), then the
    // row rests and turns, and `factor` eases it back in
    const glide = (now: number, dt: number) => {
      const target = heading > 0 ? max : 0
      const d = Math.abs(target - offset)
      if (d < 0.05) {
        offset = target
        heading = -heading
        // after a step or a drag the rest starts once that calm is over
        restUntil = Math.max(now, calmUntil) + REST_MS
        factor = 0
        return
      }
      const brake = (drift * EASE_OUT_S) / 2
      offset += heading * Math.min(d, drift * factor * dt * Math.min(1, Math.sqrt(d / brake)))
    }

    const tick = (_time: number, deltaMs: number) => {
      const now = performance.now()
      const dt = Math.min(deltaMs, 64) / 1000
      const still = hover || focus || drag || user || now < calmUntil || now < restUntil
      // loop={false} resumes more gently than it stops
      factor += ((still ? 0 : 1) - factor) * Math.min(1, dt * (loop || still ? 5 : 1.2))
      if (drag) return
      if (tween) {
        const k = Math.min(1, (now - tween.t0) / STEP_MS)
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
        offset = tween.from + (tween.to - tween.from) * e
        if (k >= 1) tween = null
      } else {
        if (Math.abs(velocity) > 4) {
          offset += velocity * dt
          velocity *= Math.exp(-dt * 4)
          if (!loop && clamp(offset) !== offset) {
            offset = clamp(offset)
            velocity = 0
          }
        } else {
          velocity = 0
          if (loop) offset += drift * factor * dt
          else glide(now, dt)
        }
        // keep the unwrapped value small; the picture is identical one period apart
        if (loop && period > 0 && (offset >= period || offset < 0)) offset = ((offset % period) + period) % period
      }
      write()
    }

    const step = (dir: number) => {
      if (loop ? !period : !max) return
      const from = offset
      const cur = tween ? tween.to : offset
      const marks: number[] = []
      if (loop) {
        const base = Math.floor(cur / period) * period
        for (let p = -1; p <= 2; p++) for (const s of starts) marks.push(base + p * period + s)
      } else {
        // each item's start, as far as the row can travel, and both ends
        for (const m of [0, ...starts.map(clamp), max]) if (!marks.some((x) => Math.abs(x - m) < 2)) marks.push(m)
        marks.sort((a, b) => a - b)
      }
      const to = dir > 0 ? marks.find((m) => m > cur + 2) : [...marks].reverse().find((m) => m < cur - 2)
      if (to === undefined) return
      velocity = 0
      tween = { from, to, t0: performance.now() }
      calmUntil = performance.now() + STEP_MS + RESUME_AFTER
    }

    controller.current = {
      step,
      setUserPaused: (p) => {
        user = p
        if (!p) calmUntil = performance.now() + 300
      },
    }

    // hover (mouse only: a touch "enter" is a tap)
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') hover = true
    }
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') hover = false
    }
    // keyboard focus anywhere inside (the region or its buttons)
    const onFocusIn = (e: FocusEvent) => {
      // loop={false}: only keyboard focus pauses (a mouse press focuses the region too and must not leave it paused)
      focus = loop || (e.target as Element).matches(':focus-visible')
    }
    const onFocusOut = (e: FocusEvent) => {
      focus = el.contains(e.relatedTarget as Node | null)
    }

    // drag (mouse and touch; vertical touch movement stays with the page: touch-action: pan-y)
    let pid = -1
    let x0 = 0
    let o0 = 0
    let lastX = 0
    let lastT = 0
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      pid = e.pointerId
      x0 = lastX = e.clientX
      lastT = e.timeStamp
      o0 = offset
      velocity = 0
      tween = null
      drag = true
      vp.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== pid) return
      offset = o0 - (e.clientX - x0)
      if (!loop) offset = clamp(offset)
      const dtm = e.timeStamp - lastT
      if (dtm > 0) velocity = 0.75 * velocity + 0.25 * ((-(e.clientX - lastX) / dtm) * 1000)
      lastX = e.clientX
      lastT = e.timeStamp
      write()
    }
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== pid) return
      drag = false
      pid = -1
      if (e.timeStamp - lastT > 90) velocity = 0 // held still before letting go
      velocity = Math.max(-2400, Math.min(2400, velocity))
      calmUntil = performance.now() + RESUME_AFTER
    }
    // horizontal trackpad swipes move the row; vertical wheel stays with the page (Lenis)
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      tween = null
      velocity = 0
      offset += e.deltaX * (e.deltaMode === 1 ? 16 : 1)
      if (!loop) offset = clamp(offset)
      calmUntil = performance.now() + RESUME_AFTER
      write()
    }

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('focusin', onFocusIn)
    el.addEventListener('focusout', onFocusOut)
    vp.addEventListener('pointerdown', onDown)
    vp.addEventListener('pointermove', onMove)
    vp.addEventListener('pointerup', onUp)
    vp.addEventListener('pointercancel', onUp)
    vp.addEventListener('wheel', onWheel, { passive: false })

    const ro = new ResizeObserver(() => {
      measure()
      write()
    })
    ro.observe(vp)
    ro.observe(tr)
    measure()
    write()

    // tick only while on screen (loop={false}: the first arrival starts with a rest, so the first photo is seen still)
    let attached = false
    let arrived = false
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !attached) {
          if (!loop && !arrived) restUntil = performance.now() + REST_MS
          arrived = true
          gsap.ticker.add(tick)
          attached = true
        } else if (!entry.isIntersecting && attached) {
          gsap.ticker.remove(tick)
          attached = false
        }
      },
      { rootMargin: '120px 0px' },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      ro.disconnect()
      if (attached) gsap.ticker.remove(tick)
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('focusin', onFocusIn)
      el.removeEventListener('focusout', onFocusOut)
      vp.removeEventListener('pointerdown', onDown)
      vp.removeEventListener('pointermove', onMove)
      vp.removeEventListener('pointerup', onUp)
      vp.removeEventListener('pointercancel', onUp)
      vp.removeEventListener('wheel', onWheel)
      tr.style.transform = ''
      controller.current = null
    }
  }, [reduced, count, speed, loop, fits])

  // loop={false}: whether the items fit side by side (then the row is still and has no controls); measured before
  // paint, so the controls never appear and vanish
  useLayoutEffect(() => {
    const vp = viewport.current
    const tr = track.current
    if (loop || !vp || !tr) return
    const check = () => setFits(tr.offsetWidth <= vp.clientWidth + 1)
    const ro = new ResizeObserver(check)
    ro.observe(vp)
    ro.observe(tr)
    check()
    return () => ro.disconnect()
  }, [loop])

  // images: lazy until the marquee is within a screen of the viewport, then all of them (copies included) load, so
  // nothing arrives blank as the row moves sideways — native lazy loading does not anticipate horizontal movement
  useEffect(() => {
    const el = root.current
    if (!el) return
    const load = () => el.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'))
    let near = false
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        near = true
        load()
      },
      { rootMargin: '100% 0px' },
    )
    preload.observe(el)
    // copies added later (a wider screen) load straight away once the marquee has been near
    const mo = new MutationObserver(() => near && load())
    mo.observe(el, { childList: true, subtree: true })
    return () => {
      preload.disconnect()
      mo.disconnect()
    }
  }, [])

  // reduced motion ('scroll'): the buttons scroll the native row by one item
  const onStep = useCallback(
    (dir: number) => {
      if (!reduced) return controller.current?.step(dir)
      const vp = viewport.current
      const first = track.current?.children[0] as HTMLElement | undefined
      if (!vp || !first) return
      vp.scrollBy({ left: dir * (first.offsetWidth + parseFloat(getComputedStyle(track.current!).columnGap || '0')), behavior: 'auto' })
    },
    [reduced],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      onStep(e.key === 'ArrowRight' ? 1 : -1)
    }
  }

  const togglePause = () => {
    const next = !userPaused
    userPausedRef.current = next
    setUserPaused(next)
    controller.current?.setUserPaused(next)
  }

  const sets = reduced || !loop ? 1 : copies
  const wrap = reduced && reducedLayout === 'wrap'
  const still = !loop && fits
  const noControls = wrap || still

  return (
    <div
      ref={root}
      className={`mq ${className ?? ''}`}
      data-reduced={reduced ? reducedLayout : undefined}
      data-static={still || undefined}
    >
      <div
        ref={viewport}
        className="mq-viewport"
        role="region"
        aria-label={label}
        tabIndex={noControls ? undefined : 0}
        onKeyDown={noControls ? undefined : onKeyDown}
      >
        <ul ref={track} className="mq-track">
          {Array.from({ length: sets }, (_, s) =>
            items.map((it) => (
              <li key={`${s}:${it.key}`} className="mq-item" aria-hidden={s > 0 || undefined} inert={s > 0 || undefined}>
                {it.node}
              </li>
            )),
          )}
        </ul>
      </div>
      {!noControls && (
        <div className="mq-controls">
          {controls === 'steps' && (
            <button type="button" className="mq-btn mq-btn--icon" aria-label="Previous" onClick={() => onStep(-1)}>
              <span aria-hidden="true">←</span>
            </button>
          )}
          {!reduced && (
            <button type="button" className="mq-btn" aria-pressed={userPaused} onClick={togglePause}>
              {userPaused ? 'Play' : 'Pause'}
            </button>
          )}
          {controls === 'steps' && (
            <button type="button" className="mq-btn mq-btn--icon" aria-label="Next" onClick={() => onStep(1)}>
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
