'use client'

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { BRAND } from '@/content/site'
import { useExperienceStore, type IntroPhase } from '@/state/experienceStore'
import { lenisRef } from '@/motion/SmoothScrollProvider'

/**
 * Opening schedule, in seconds from page load (navigation start).
 *   0–2 s  courier loader (product hidden)   2–3.55 s  INFINOS logo formation
 *   3.55–4.4 s  the logo shrinks into its place in the navigation bar   3.9 s  product reveal begins
 * The visual choreography lives in src/app/intro.css (absolute animation delays in seconds); every animation is
 * pinned to page load via the Web Animations API, so CSS and this state machine share one clock.
 */
export const INTRO_TIMING = {
  logoAt: 2.0,
  /** the formed logo starts to shrink into the navigation bar's logo */
  flyAt: 3.55,
  /** the flight into the navigation bar (intro seconds) */
  fly: 0.85,
  /** product reveal starts while the logo is still on its way */
  productAt: 3.9,
  /** product fade-in (visibility only; the frame is already full resolution and exposure) — matches intro.css */
  productIn: 1.1,
  /** if neither the opening frames nor the live model can show the product at 4 s, wait up to this long */
  maxWait: 10,
  /** after `ready`, the flown logo stays until the navigation bar has faded in under it (ms, real time) */
  handover: 700,
}

/**
 * Touch screens play the same choreography 1.25x faster, timed from the moment it starts running. On a phone the page
 * becomes interactive later than on a desktop, and with the desktop's clock (absolute, from page load) the loader and
 * the logo were already part-way through when they appeared — the opening jumped, then felt slow. Desktop (mouse and
 * trackpad) keeps its clock and tempo.
 */
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
const TYPE = `${BRAND.name} ${BRAND.suffix}`
/** while the intro's logo is flying into the navigation bar, the bar's own logo waits hidden under it (intro.css) */
const BRAND_PENDING = 'intro-brand-pending'

const STREAKS = [
  { y: 18, d: 0.62, o: -0.1, w: 22, c: 'w' },
  { y: 31, d: 0.86, o: -0.5, w: 30, c: 'c' },
  { y: 44, d: 0.55, o: -0.3, w: 16, c: 'w' },
  { y: 67, d: 0.74, o: -0.2, w: 26, c: 'y' },
  { y: 78, d: 0.5, o: -0.42, w: 18, c: 'w' },
  { y: 88, d: 0.95, o: -0.65, w: 34, c: 'c' },
]

/**
 * Cinematic opening: courier loader -> INFINOS logo formation -> the logo shrinks into the navigation bar -> product.
 * The logo never fades: it lands exactly on the bar's logo, which is shown under it once the bar has faded in. Scrolling
 * is locked until `ready`, after which the scroll-driven MOVE layout takes over.
 */
export function IntroSequence() {
  const phase = useExperienceStore((s) => s.introPhase)
  const progress = useExperienceStore((s) => s.openingProgress)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    performance.mark('intro-start')
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    document.documentElement.classList.add('intro-lock')
    lenisRef.current?.stop()
    const T = INTRO_TIMING
    const root = rootRef.current
    const html = document.documentElement
    const reduced = root?.dataset.run === 'reduced'
    let productStart = -1
    let raf = 0
    let handoverTimer = 0
    if (!reduced) html.classList.add(BRAND_PENDING)

    // the flown logo hands over to the navigation bar's own logo (same place, same size): no fade, no jump
    const handover = () => {
      window.clearTimeout(handoverTimer)
      window.removeEventListener('scroll', handover)
      if (root) root.dataset.gone = ''
      html.classList.remove(BRAND_PENDING)
    }

    // the formed mark shrinks into the navigation bar's logo, measured where the bar will rest once it is shown
    const fly = () => {
      const mark = root?.querySelector<HTMLElement>('.lg-dive')
      const logo = document.querySelector<HTMLElement>('.nav-brand img')
      const nav = logo?.closest<HTMLElement>('.nav')
      if (reduced || !mark || !logo || !nav || typeof mark.animate !== 'function') return
      const from = mark.getBoundingClientRect()
      const to = logo.getBoundingClientRect()
      if (!from.width || !to.width) return
      const t = getComputedStyle(nav).transform
      const navY = t && t !== 'none' ? new DOMMatrixReadOnly(t).m42 : 0
      const dx = to.left - from.left
      const dy = to.top - navY - from.top
      const flight = (T.fly / clock.rate) * 1000
      mark.animate(
        [{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${to.width / from.width}, ${to.height / from.height})` }],
        { duration: flight, easing: 'cubic-bezier(0.65, 0, 0.2, 1)', fill: 'forwards' },
      )
      // docking: one reflection crosses the logo as it settles into its place
      mark.querySelector<HTMLElement>('.lg-sheen')?.animate(
        [
          { opacity: 0, transform: 'translateX(-140%) skewX(-18deg)' },
          { opacity: 1, offset: 0.2 },
          { opacity: 1, offset: 0.7 },
          { opacity: 0, transform: 'translateX(400%) skewX(-18deg)' },
        ],
        { duration: 520, delay: flight - 140, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'backwards' },
      )
    }

    // Phase state machine on the intro's clock (intro.css time). Visuals are compositor animations (intro.css),
    // so a busy main thread (e.g. the 3D model compiling during the loader) cannot stall them.
    const tick = () => {
      // the choreography's own clock: seconds of intro time (intro.css delays), on touch screens from its start
      const now = ((performance.now() - clock.originMs) / 1000) * clock.rate
      const st = useExperienceStore.getState()
      if (productStart < 0) {
        if (now >= T.logoAt && st.introPhase === 'loading') set('logo')
        if (now >= T.flyAt && st.introPhase === 'logo') {
          set('outro')
          fly()
        }
        // the product reveal begins while the logo flies (the opening frames are normally ready by ~0.8 s; if not,
        // the live model shows the identical first pose — only if neither can show the product does it wait)
        if (now >= T.productAt && (st.openingReady || st.modelReady || now > T.maxWait)) {
          productStart = now
          set('product')
          performance.mark('product-start')
        }
      } else {
        // the reveal itself is a compositor fade of the overlay (intro.css, also with reduced motion — a fade is not
        // movement); scrolling unlocks once it has finished
        if (now - productStart >= T.productIn) {
          set('ready')
          html.classList.remove('intro-lock')
          lenisRef.current?.start()
          // the navigation bar fades in under the landed logo; scrolling first hands over at once
          if (reduced) handover()
          else {
            handoverTimer = window.setTimeout(handover, T.handover)
            window.addEventListener('scroll', handover, { passive: true })
          }
          return
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(handoverTimer)
      window.removeEventListener('scroll', handover)
      html.classList.remove('intro-lock', BRAND_PENDING)
    }
  }, [])

  // Start the choreography (data-run is set imperatively, so React re-renders never touch it). Its delays are absolute
  // intro time: on desktop every animation starts at time 0 of the document timeline (navigation start, the origin of
  // performance.now()); on touch screens at this moment, played COMPACT_RATE times faster (the state machine above
  // reads the same clock).
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = useExperienceStore.getState().reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compact = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    clock.originMs = compact ? performance.now() : 0
    clock.rate = compact ? COMPACT_RATE : 1
    root.dataset.run = reduced ? 'reduced' : 'motion'
    if (typeof root.getAnimations === 'function')
      for (const a of root.getAnimations({ subtree: true })) {
        // the rate first: changing it afterwards would move the start time to keep the current time
        a.playbackRate = clock.rate
        a.startTime = clock.originMs
      }
  }, [])

  const product = phase === 'product' || phase === 'ready'
  return (
    <div
      ref={rootRef}
      className={`intro ${product ? 'intro--product' : ''}`}
      data-phase={phase}
      aria-hidden={product}
    >
      <div className="intro-bg" />

      {/* ── 3.9 s: studio light opens around the product (under the flying logo) ── */}
      <span className="intro-iris" />

      {/* ── 0–2 s: courier loader ── */}
      <div className="intro-loading">
        <div className="ld-sky ld-sky--far" />
        <div className="ld-sky ld-sky--near" />
        <div className="ld-streaks">
          {STREAKS.map((s, i) => (
            <span key={i} className={`ld-streak ld-streak--${s.c}`}
              style={{ top: `${s.y}%`, width: `${s.w}%`, animationDuration: `${s.d}s`, animationDelay: `${s.o}s` }} />
          ))}
        </div>
        <div className="ld-road">
          <span className="ld-lanes" />
        </div>
        <div className="ld-move">
          <div className="ld-jitter">
            <div className="ld-trail">
              <span /><span /><span /><span />
            </div>
            <span className="ld-beam" />
            <CourierVehicle />
            <span className="ld-wheel" style={{ left: `${(65 / 320) * 100}%` }} />
            <span className="ld-wheel" style={{ left: `${(241 / 320) * 100}%` }} />
          </div>
        </div>
        <span className="ld-collapse" />
        <div className="ld-meter" role="progressbar" aria-label="Loading INFINOS" aria-valuemin={0} aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}>
          <span className="ld-meter-label">{BRAND.name} PRO</span>
          <span className="ld-meter-track">
            <span className="ld-meter-fill" style={{ transform: `scaleX(${Math.max(0.04, progress)})` }} />
          </span>
          <span className="ld-meter-pct">{String(Math.round(progress * 100)).padStart(3, '0')}</span>
        </div>
      </div>

      {/* ── 2–3.55 s: logo formation, then it shrinks into the navigation bar ── */}
      <div className="intro-logo">
        <span className="lg-flare" />
        <span className="lg-streak" />
        <div className="lg-stage">
          <span className="lg-floor" />
          <div className="lg-dive">
            <div className="lg-tilt">
              <span className="lg-band" style={box(0, 62, 411, 209)} />
              <span className="lg-bar" style={box(0, 0, 411, 62)} />
              <span className="lg-bar lg-bar--bottom" style={box(0, 271, 411, 56)} />
              <span className="lg-trace lg-trace--top" style={box(0, 162, 411, 3)} />
              <span className="lg-trace lg-trace--bottom" style={box(0, 162, 411, 3)} />
              <span className="lg-core" style={box(66, 68, 273, 193)}>
                <span className="lg-word" aria-hidden="true">infinos</span>
              </span>
              <span className="lg-side lg-side--t" style={box(26, 26, 353, 42)} />
              <span className="lg-side lg-side--r" style={box(339, 68, 40, 193)} />
              <span className="lg-side lg-side--b" style={box(26, 261, 353, 43)} />
              <span className="lg-side lg-side--l" style={box(26, 68, 40, 193)} />
              <span className="lg-tm" style={box(377, 305, 32, 20)}>TM</span>
              <span className="lg-sheen-clip"><span className="lg-sheen" /></span>
            </div>
          </div>
          <div className="lg-type">
            <h1 className="lg-type-name" aria-label={TYPE}>
              {TYPE.split('').map((ch, i) => (
                <span key={i} className={`lg-type-ch ${i >= BRAND.name.length ? 'lg-type-ch--suffix' : ''}`} style={{ '--i': i } as CSSProperties} aria-hidden="true">
                  {ch === ' ' ? ' ' : ch}
                </span>
              ))}
            </h1>
            <p className="lg-type-tagline">{BRAND.tagline}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Side view of an INFINOS electric courier van (graphite body, brand accent stripe, nested-frame emblem). */
function CourierVehicle() {
  return (
    <svg className="ld-body" viewBox="0 0 320 120" aria-hidden="true">
      <defs>
        <linearGradient id="ldPaint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a404b" />
          <stop offset="0.45" stopColor="#22262e" />
          <stop offset="1" stopColor="#121419" />
        </linearGradient>
        <linearGradient id="ldGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5f6d82" />
          <stop offset="0.5" stopColor="#1b2230" />
          <stop offset="1" stopColor="#0b0e14" />
        </linearGradient>
        <linearGradient id="ldStripe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#cd6256" />
          <stop offset="1" stopColor="#f3b953" />
        </linearGradient>
        <radialGradient id="ldHead" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fffbe9" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="114" rx="150" ry="5" fill="#000" opacity="0.55" />
      {/* body: cargo box, cabin and sloped nose */}
      <path
        d="M18 94 L18 40 Q18 25 33 24 L198 22 Q215 22 228 31 L263 55 Q292 58 302 70 Q308 78 307 90 L307 96 Q307 101 301 101 L24 101 Q18 101 18 95 Z"
        fill="url(#ldPaint)"
      />
      <path d="M33 24.6 L198 22.6 Q214 22.6 226 30.6" fill="none" stroke="#9aa4b4" strokeOpacity="0.55" strokeWidth="1.2" />
      {/* windows */}
      <path d="M205 31 L223 32.5 Q230 34 236 40 L254 56 L205 56 Z" fill="url(#ldGlass)" />
      <path d="M209 34 L221 35 L230 44" fill="none" stroke="#c9d6ea" strokeOpacity="0.35" strokeWidth="1.4" />
      {/* panel lines */}
      <path d="M200 26 L200 99 M120 26 L120 99" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1" />
      {/* brand stripe */}
      <rect x="22" y="80" width="281" height="5" rx="1.5" fill="url(#ldStripe)" />
      <rect x="22" y="87" width="281" height="1.2" fill="#f3b953" opacity="0.5" />
      {/* nested-frame emblem (the INFINOS mark, in miniature) */}
      <g transform="translate(40 36)">
        <rect width="41" height="33" fill="#cd6256" />
        <rect y="6.2" width="41" height="21" fill="#000" />
        <rect x="2.6" y="2.6" width="35.3" height="27.8" fill="#f3b953" />
        <rect x="6.6" y="6.8" width="27.3" height="19.3" fill="#000" />
      </g>
      <text x="92" y="59" fill="#ece8df" fillOpacity="0.85" fontSize="12.5" letterSpacing="3.2"
        style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}>INFINOS</text>
      {/* wheel arches */}
      <path d="M58 101 A28 28 0 0 1 114 101 Z M234 101 A28 28 0 0 1 290 101 Z" fill="#07080a" />
      {/* lights */}
      <rect x="297" y="71" width="9" height="6" rx="2" fill="#fff6d8" />
      <circle cx="303" cy="74" r="10" fill="url(#ldHead)" />
      <rect x="18" y="42" width="3.5" height="22" rx="1.5" fill="#ff4a3d" />
      <rect x="15" y="42" width="5" height="22" rx="2" fill="#ff4a3d" opacity="0.35" />
    </svg>
  )
}
