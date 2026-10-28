'use client'

import { useEffect, useRef } from 'react'
import { STORY } from '@/content/story'
import { STORY_RANGES, chapterAt, smoothstep } from '@/motion/chapters'
import { cameraAt } from '@/motion/cameraTrack'
import { anchorWorld } from '@/motion/anchors'
import { compositionAt, layoutMode, type Composition, type LayoutMode } from '@/motion/composition'
import { addRenderer } from '@/motion/frameLoop'
import { filmLayout, projectToFilm } from '@/motion/sequences'
import { useExperienceStore } from '@/state/experienceStore'
import { openProductViewer } from '@/components/viewer/ProductViewer'
import { PILLARS, ZONES } from '@/content/platform'
import { StoryFigure } from './Figures'

/**
 * Editorial layer over the product stage: one chapter headline at a time, set in the negative space the composition
 * leaves beside (landscape) or below (portrait) the product, a few hairline callouts locked to real features of the
 * product, and a quiet chapter index.
 *
 * Every per-frame change is a direct style write from the shared frame loop (motion/frameLoop.ts) — the same frame as
 * the scroll update, the photoreal frame and the 3D render — so text and product move together, scrolling back
 * reverses everything exactly, and React never re-renders while the visitor scrolls.
 */
const CALLOUTS = STORY.flatMap((c, chapter) => c.callouts.map((callout) => ({ ...callout, chapter })))
/** the chapter index names the central idea (act) a chapter belongs to */
const actLabel = (act: number) => (act ? `${PILLARS[act - 1].numeral} · ${PILLARS[act - 1].title}` : 'The complete system')
const ZONE_MARKS = STORY.flatMap((c, chapter) => (c.zones ?? []).map((z) => ({ ...z, chapter })))
const EDGE = 0.008 // callout fade width (global progress)

function chapterVisibility(i: number, p: number) {
  const r = STORY_RANGES[i]
  const len = r.end - r.start
  const d = Math.min(0.018, len * 0.22)
  // chapter 01 appears while the product glides from the centre into its composition
  const enter = STORY[i].enter ?? r.start
  const fadeIn = i === 0 ? smoothstep(0.022, 0.068, p) : smoothstep(enter, enter + d, p)
  const fadeOut = i === STORY.length - 1 ? 1 : 1 - smoothstep(r.end - d, r.end, p)
  return { fadeIn, fadeOut, opacity: Math.min(fadeIn, fadeOut) }
}

export function StoryOverlay() {
  const rootRef = useRef<HTMLDivElement>(null)
  const chapterRefs = useRef<(HTMLElement | null)[]>([])
  const calloutRefs = useRef<(HTMLDivElement | null)[]>([])
  const zoneRefs = useRef<(HTMLDivElement | null)[]>([])
  const indexRef = useRef<HTMLSpanElement>(null)
  const nameRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLElement>(null)
  const scrimRefs = useRef<Record<'left' | 'right' | 'below', HTMLDivElement | null>>({ left: null, right: null, below: null })

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const comp: Composition = { x: 0.5, y: 0.5, s: 1 }
    const last = new Map<HTMLElement, string>()
    const write = (el: HTMLElement | null, opacity: number, transform: string) => {
      if (!el) return
      const key = `${opacity.toFixed(3)}|${transform}`
      if (last.get(el) === key) return
      last.set(el, key)
      el.style.opacity = opacity.toFixed(3)
      el.style.transform = transform
      el.style.visibility = opacity < 0.005 ? 'hidden' : 'visible'
    }
    let mode: LayoutMode | null = null
    let size = ''
    let active = -1
    let labelWidths: number[] = []

    // chapter text sides follow the composition: opposite the product on landscape screens, below it on portrait ones
    const layout = (W: number, H: number) => {
      mode = layoutMode(W, H)
      root.dataset.layout = mode
      STORY.forEach((_, i) => {
        const el = chapterRefs.current[i]
        if (!el) return
        const r = STORY_RANGES[i]
        const c = compositionAt((r.start + r.end) / 2, mode as LayoutMode)
        el.dataset.side = mode !== 'landscape' ? 'below' : c.x > 0.52 ? 'left' : c.x < 0.48 ? 'right' : 'left'
      })
    }

    const render = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      if (`${W}x${H}` !== size) {
        size = `${W}x${H}`
        layout(W, H)
        last.clear()
        labelWidths = []
      }
      const st = useExperienceStore.getState()
      const p = st.progress
      const shown = st.introPhase === 'ready'
      root.classList.toggle('ed--ready', shown)

      // chapter text (+ the scrim on its side, so the text always reads, even over a close-up)
      const scrim = { left: 0, right: 0, below: 0 }
      for (let i = 0; i < STORY.length; i++) {
        const v = chapterVisibility(i, p)
        const el = chapterRefs.current[i]
        const side = (el?.dataset.side ?? 'left') as keyof typeof scrim
        // the hero's explore card (below this layer) takes chapter 01's place while a hotspot is open
        const o = i === 0 && st.hotspot ? 0 : v.opacity
        scrim[side] = Math.max(scrim[side], shown ? o : 0)
        write(el, o, `translate3d(0, ${((1 - v.fadeIn) * 26 - (1 - v.fadeOut) * 18).toFixed(1)}px, 0)`)
      }
      for (const k of ['left', 'right', 'below'] as const) write(scrimRefs.current[k], scrim[k], 'none')

      // chapter index
      const idx = Math.max(0, STORY_RANGES.findIndex((r, i) => p >= r.start && (p < r.end || i === STORY_RANGES.length - 1)))
      if (idx !== active) {
        active = idx
        if (indexRef.current) indexRef.current.textContent = STORY[idx].index
        if (nameRef.current) nameRef.current.textContent = actLabel(STORY[idx].act)
      }
      if (barRef.current) {
        const t = `scaleX(${Math.min(1, Math.max(0, p)).toFixed(4)})`
        if (barRef.current.style.transform !== t) barRef.current.style.transform = t
      }

      // callouts: real features of the product, projected through the current camera and composition
      const chapter = chapterAt(p)
      const cp = Math.min(1, Math.max(0, (p - chapter.start) / (chapter.end - chapter.start)))
      let pose: ReturnType<typeof cameraAt> | null = null
      let l: ReturnType<typeof filmLayout> | null = null
      const phone = mode === 'phone'
      let phoneShown = false
      CALLOUTS.forEach((c, i) => {
        const el = calloutRefs.current[i]
        if (!el) return
        let o = smoothstep(c.window[0], c.window[0] + EDGE, p) * (1 - smoothstep(c.window[1] - EDGE, c.window[1], p))
        if (phone && (!c.phone || phoneShown)) o = 0
        if (o <= 0.001 || !shown) {
          write(el, 0, el.style.transform || 'translate3d(-999px,0,0)')
          return
        }
        if (phone) phoneShown = true
        pose ??= cameraAt(chapter.phase, cp)
        l ??= filmLayout(W, H, pose, compositionAt(p, mode as LayoutMode, comp))
        const [fx, fy] = projectToFilm(pose, anchorWorld(c.component, c.point, st.stages))
        const x = fx * l.w - l.ox
        const y = fy * l.h - l.oy
        // keep clear of the navigation (and, on portrait screens, the chapter index and 360° button below it)
        if (x < 8 || x > W - 8 || y < (mode === 'landscape' ? 60 : 118) || y > H - 8) {
          write(el, 0, el.style.transform || 'translate3d(-999px,0,0)')
          return
        }
        // labels point away from the chapter text (beside layouts), and flip when they would not fit on screen
        const textSide = chapterRefs.current[c.chapter]?.dataset.side
        const want = textSide === 'left' ? 'right' : textSide === 'right' ? 'left' : c.side
        const need = (labelWidths[i] ??= (el.querySelector('.ed-callout-label') as HTMLElement | null)?.offsetWidth ?? 200) + 72
        const room = want === 'right' ? W - x : x
        el.dataset.side = room < need && (want === 'right' ? x : W - x) > room ? (want === 'right' ? 'left' : 'right') : want
        write(el, o, `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`)
      })

      // temperature-zone brackets along the real chambers (same projection as the callouts)
      ZONE_MARKS.forEach((z, i) => {
        const el = zoneRefs.current[i]
        if (!el) return
        const o = smoothstep(z.window[0], z.window[0] + EDGE, p) * (1 - smoothstep(z.window[1] - EDGE, z.window[1], p))
        if (o <= 0.001 || !shown) {
          write(el, 0, el.style.transform || 'translate3d(-999px,0,0)')
          return
        }
        pose ??= cameraAt(chapter.phase, cp)
        l ??= filmLayout(W, H, pose, compositionAt(p, mode as LayoutMode, comp))
        const [ax, ay] = projectToFilm(pose, anchorWorld(z.component, z.top, st.stages))
        const [bx, by] = projectToFilm(pose, anchorWorld(z.component, z.bottom, st.stages))
        const x1 = ax * l.w - l.ox, y1 = ay * l.h - l.oy, x2 = bx * l.w - l.ox, y2 = by * l.h - l.oy
        const dx = x2 - x1, dy = y2 - y1
        const len = Math.max(1, Math.hypot(dx, dy))
        const line = el.firstElementChild as HTMLElement | null
        const tickB = el.children[2] as HTMLElement | undefined
        const label = el.children[3] as HTMLElement | undefined
        if (line) line.style.transform = `rotate(${(-Math.atan2(dx, dy) * 180) / Math.PI}deg) scaleY(${(len / 100).toFixed(3)})`
        if (tickB) tickB.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`
        if (label) label.style.transform = `translate3d(${(dx / 2).toFixed(1)}px, ${(dy / 2).toFixed(1)}px, 0)`
        write(el, o, `translate3d(${x1.toFixed(1)}px, ${y1.toFixed(1)}px, 0)`)
      })
    }

    return addRenderer(render, 10)
  }, [])

  return (
    <div ref={rootRef} className="ed" aria-label="INFINOS — smart cold-chain technology: product story">
      {(['left', 'right', 'below'] as const).map((k) => (
        <div key={k} ref={(el) => { scrimRefs.current[k] = el }} className={`ed-scrim ed-scrim--${k}`} aria-hidden="true" />
      ))}
      {STORY.map((c, i) => (
        <section
          key={c.id}
          ref={(el) => { chapterRefs.current[i] = el }}
          className="ed-chapter"
          data-chapter={c.id}
          style={{ opacity: 0, visibility: 'hidden' }}
        >
          <p className="ed-kicker">
            <span className="ed-kicker-index">{c.index}</span>
            <span className="ed-kicker-name">{c.name}</span>
          </p>
          <h2 className="ed-headline">{c.headline}</h2>
          <p className="ed-body">{c.body}</p>
          {c.figure && (
            <div className="ed-figure">
              <StoryFigure id={c.figure} />
            </div>
          )}
          {c.shown && <p className="ed-note ed-note--shown">{c.shown}</p>}
          {c.note && <p className="ed-note">{c.note}</p>}
          {c.cta && (
            <div className="ed-cta">
              <button type="button" className="ed-cta-btn ed-cta-btn--primary" onClick={(e) => openProductViewer(e.currentTarget)}>
                Explore in 360°
              </button>
              <button type="button" className="ed-cta-btn" onClick={() => document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' })}>
                Product range
              </button>
              <button type="button" className="ed-cta-btn" onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}>
                Contact
              </button>
            </div>
          )}
        </section>
      ))}
      {CALLOUTS.map((c, i) => (
        <div
          key={`${c.component}-${i}`}
          ref={(el) => { calloutRefs.current[i] = el }}
          className="ed-callout"
          data-side={c.side}
          style={{ opacity: 0, visibility: 'hidden' }}
          aria-hidden="true"
        >
          <span className="ed-callout-dot" />
          <span className="ed-callout-line" />
          <span className="ed-callout-label">
            <span className="ed-callout-full">{c.label}</span>
            <span className="ed-callout-short">{c.short ?? c.label}</span>
          </span>
        </div>
      ))}
      {ZONE_MARKS.map((z, i) => {
        const zone = ZONES[z.zone]
        return (
          <div
            key={`zone-${i}`}
            ref={(el) => { zoneRefs.current[i] = el }}
            className="ed-zone"
            // the zone colour comes from its token, so it can deepen on the lit studio (studio.css)
            style={{ opacity: 0, visibility: 'hidden', ['--zone' as string]: `var(--${z.zone})` }}
            aria-hidden="true"
          >
            <span className="ed-zone-line" />
            <span className="ed-zone-tick" />
            <span className="ed-zone-tick" />
            <span className="ed-zone-label">
              <b>{zone.name}</b>
              <span>{zone.chamber}</span>
              <em>{zone.prefix} {zone.temp}</em>
            </span>
          </div>
        )
      })}
      <div className="ed-progress" aria-hidden="true">
        <span ref={indexRef} className="ed-progress-index">01</span>
        <span className="ed-progress-total">/ 08</span>
        <span ref={nameRef} className="ed-progress-name">{actLabel(STORY[0].act)}</span>
        <span className="ed-progress-track">
          <i ref={barRef} />
        </span>
      </div>
    </div>
  )
}
