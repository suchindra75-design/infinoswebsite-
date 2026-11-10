'use client'

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { BRAND } from '@/content/site'
import { useExperienceStore, type IntroPhase } from '@/state/experienceStore'
import { lenisRef } from '@/motion/SmoothScrollProvider'

/**
 * Opening: the INFINOS lockup, then the product.
 *
 * One calm movement instead of a sequence of effects: the mark (built from the logo artwork's own geometry, as one
 * piece) settles in on the midnight of the unlit studio, the name and tagline follow, and the lockup holds until the
 * product can actually be shown — so it never leaves onto an empty screen. It then lifts away and the studio light
 * opens on the bag. A hairline under the tagline shows the opening frames loading, only while they are.
 *
 * Times are seconds of intro time (intro.css animation delays). The entrance runs on the compositor (Web Animations,
 * started from this component's clock); the exit and the product reveal are phase classes, so they wait for the
 * product instead of a fixed schedule.
 */
export const INTRO_TIMING = {
  /** the lockup is complete; the live model may start mounting behind it (desktop) */
  logoAt: 1.25,
  /** earliest moment the lockup lifts away (it holds longer while the product is not ready) */
  holdUntil: 2.55,
  /** the lockup's exit, before the product reveal starts (real seconds, intro.css .intro--outro) */
  exit: 0.5,
  /** product fade-in (visibility only; the frame is already full resolution and exposure) — matches intro.css */
  productIn: 1.1,
  /** if neither the opening frames nor the live model can show the product, stop waiting after this long */
  maxWait: 10,
}

/** touch screens play the entrance 1.25x faster (a phone is held closer, and its page becomes interactive later) */
const COMPACT_RATE = 1.25
const clock = { originMs: 0, rate: 1 }

const set = (introPhase: IntroPhase) => useExperienceStore.setState({ introPhase })

/* Logo geometry, measured from the INFINOS artwork (units of the 411 x 327 outer rectangle). */
const MW = 411
const MH = 327
const box = (x: number, y: number, w: number, h: number): CSSProperties => ({
  left: `${(x / MW) * 100}%`,
  top: `${(y / MH) * 100}%`,
  width: `${(w / MW) * 100}%`,
  height: `${(h / MH) * 100}%`,
})

export function IntroSequence() {
  const phase = useExperienceStore((s) => s.introPhase)
  const progress = useExperienceStore((s) => s.openingProgress)
  const framesReady = useExperienceStore((s) => s.openingReady)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    performance.mark('intro-start')
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    document.documentElement.classList.add('intro-lock')
    lenisRef.current?.stop()
    const T = INTRO_TIMING
    let outroAt = -1
    let productAt = -1
    let raf = 0

    const tick = () => {
      // intro time: the entrance's own clock (intro.css delays); real seconds once the lockup starts to leave
      const now = ((performance.now() - clock.originMs) / 1000) * clock.rate
      const real = performance.now() / 1000
      const st = useExperienceStore.getState()
      const canShow = st.openingReady || st.modelReady || now > T.maxWait
      if (outroAt < 0) {
        if (now >= T.logoAt && st.introPhase === 'loading') set('logo')
        if (now >= T.holdUntil && canShow) {
          outroAt = real
          set('outro')
        }
      } else if (productAt < 0) {
        if (real - outroAt >= T.exit) {
          productAt = real
          set('product')
          performance.mark('product-start')
        }
      } else if (real - productAt >= T.productIn) {
        // the reveal is a compositor fade of the overlay; scrolling unlocks once it has finished
        set('ready')
        document.documentElement.classList.remove('intro-lock')
        lenisRef.current?.start()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('intro-lock')
    }
  }, [])

  // Start the entrance (data-run is set imperatively, so React re-renders never touch it): its delays are intro time,
  // from this moment, at the device's tempo (the state machine above reads the same clock).
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = useExperienceStore.getState().reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compact = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    clock.originMs = performance.now()
    clock.rate = compact ? COMPACT_RATE : 1
    root.dataset.run = reduced ? 'reduced' : 'motion'
    if (typeof root.getAnimations === 'function')
      for (const a of root.getAnimations({ subtree: true })) {
        // the rate first: changing it afterwards would move the start time to keep the current time
        a.playbackRate = clock.rate
        a.startTime = clock.originMs
      }
  }, [])

  const leaving = phase === 'outro' || phase === 'product' || phase === 'ready'
  const product = phase === 'product' || phase === 'ready'
  return (
    <div
      ref={rootRef}
      className={`intro ${leaving ? 'intro--outro' : ''} ${product ? 'intro--product' : ''} ${phase === 'ready' ? 'intro--done' : ''}`}
      data-phase={phase}
    >
      <div className="intro-bg" />

      <div className="intro-lockup">
        {/* the INFINOS mark: coral shell, black band, gold frame, the wordmark in the core — one piece, as drawn */}
        <div className="lu-mark" aria-hidden="true">
          <span className="lu-band" style={box(0, 62, 411, 209)} />
          <span className="lu-bar" style={box(0, 0, 411, 62)} />
          <span className="lu-bar" style={box(0, 271, 411, 56)} />
          <span className="lu-core" style={box(66, 68, 273, 193)}>
            <span className="lu-word">infinos</span>
          </span>
          <span className="lu-side" style={box(26, 26, 353, 42)} />
          <span className="lu-side" style={box(339, 68, 40, 193)} />
          <span className="lu-side" style={box(26, 261, 353, 43)} />
          <span className="lu-side" style={box(26, 68, 40, 193)} />
          <span className="lu-tm" style={box(377, 305, 32, 20)}>TM</span>
        </div>
        <h1 className="lu-name" aria-label={`${BRAND.name} ${BRAND.suffix}`}>
          <span aria-hidden="true">{BRAND.name}</span>
          <span className="lu-suffix" aria-hidden="true">{BRAND.suffix}</span>
        </h1>
        <p className="lu-tagline">{BRAND.tagline}</p>
        <div
          className={`lu-progress ${framesReady || leaving ? 'lu-progress--done' : ''}`}
          role="progressbar"
          aria-label="Loading INFINOS"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span style={{ transform: `scaleX(${Math.max(0.02, progress)})` }} />
        </div>
      </div>

      {/* the studio light opens around the product */}
      <span className="intro-iris" />
    </div>
  )
}
