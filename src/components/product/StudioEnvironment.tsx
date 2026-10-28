'use client'

import { useEffect, useRef } from 'react'
import { useExperienceStore } from '@/state/experienceStore'
import { chapterAt } from '@/motion/chapters'
import { cameraAt } from '@/motion/cameraTrack'
import { compositionAt, layoutMode, type Composition } from '@/motion/composition'
import { filmLayout, projectToFilm, type Vec3 } from '@/motion/sequences'
import { addRenderer } from '@/motion/frameLoop'
import { studioLightAt } from '@/motion/studioLight'

/** the floor meets the wall this far behind the bag, along the camera's view (metres) */
const COVE_DISTANCE = 3.4
/** half the size the pool and wash gradients are drawn at (studio.css); they are only moved and scaled */
const GLOW = 128
/** the moving floor layer starts this far (in viewport heights) above the cove (studio.css .studio-floor) */
const FLOOR_TOP = 0.4
const FLOOR_HEIGHT = 1.1
/** ms after the intro: the room (studio.css: 0.95 s delay + 1.9 s rise) is about half lit */
const INK_AT = 1750

/**
 * The atelier behind the product (docs/PROPOSAL_ART_DIRECTION_R2.md, concept 2): a pale stone cyclorama lit by a tall
 * window on the left. Both product layers (the photoreal frames and the live model) are drawn over it, inside .stage.
 *
 * The room is physical: the cove where floor meets wall, the light pool on the floor and the wash on the wall behind the
 * product are projected through the same camera and editorial composition as the product, every frame the story moves.
 * Every layer is a static gradient that is only translated, scaled or faded, so scrolling never repaints it.
 *
 * First Light: the stage starts unlit, exactly the intro's own backdrop, so the intro hands over as it always has —
 * then, once it is done, the studio lights come up around the bag (studio.css). It runs once, on the compositor.
 */
export function StudioEnvironment() {
  const rootRef = useRef<HTMLDivElement>(null)
  const intro = useExperienceStore((s) => s.introPhase)
  const reduced = useExperienceStore((s) => s.reducedMotion)

  // with reduced motion the lights are already up when the intro fades away (a fade, not a movement)
  const lit = reduced || intro === 'ready'
  useEffect(() => {
    const html = document.documentElement
    html.dataset.studio = lit ? 'lit' : 'unlit'
    if (!lit) return
    if (reduced) {
      html.dataset.ink = 'dark'
      return
    }
    // the overlays change to graphite ink as the rising room passes mid-grey, cross-fading their colours (studio.css)
    const ink = window.setTimeout(() => {
      html.dataset.inkFade = ''
      html.dataset.ink = 'dark'
    }, INK_AT)
    const settle = window.setTimeout(() => delete html.dataset.inkFade, INK_AT + 900)
    return () => {
      window.clearTimeout(ink)
      window.clearTimeout(settle)
    }
  }, [lit, reduced])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const floor = root.querySelector<HTMLElement>('.studio-floor')!
    const underfloor = root.querySelector<HTMLElement>('.studio-underfloor')!
    const warm = root.querySelector<HTMLElement>('.studio-warm')!
    const windowLight = root.querySelector<HTMLElement>('.studio-window')!
    const pool = root.querySelector<HTMLElement>('.studio-pool')!
    const wash = root.querySelector<HTMLElement>('.studio-wash')!
    const comp: Composition = { x: 0.5, y: 0.5, s: 1 }
    const light = studioLightAt(0)
    const last = new Map<HTMLElement, string>()
    const write = (el: HTMLElement, transform: string, opacity: number) => {
      const key = `${transform}|${opacity.toFixed(3)}`
      if (last.get(el) === key) return
      last.set(el, key)
      el.style.transform = transform
      el.style.opacity = opacity.toFixed(3)
    }
    const circle: Vec3[] = Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2
      // the pool sits a little behind and right of the bag, where the key light (upper front-left) throws its light
      return [0.25 + Math.cos(a) * 1.55, 0, -0.3 + Math.sin(a) * 1.55]
    })
    const corners: Vec3[] = []
    for (const x of [-0.76, 0.76]) for (const y of [0, 1.8]) for (const z of [-0.69, 0.69]) corners.push([x, y, z])

    // where the cove lies when the story ends: the coolant showcase's static copy of this room (studio.css --atelier)
    // puts its own cove there, so the bag can dissolve out of an unchanged room. Measured once per viewport size.
    let size = ''
    const coveAtEnd = (W: number, H: number) => {
      const pose = cameraAt('overview', 1)
      const l = filmLayout(W, H, pose, compositionAt(1, layoutMode(W, H), comp))
      let hx = pose.target[0] - pose.pos[0]
      let hz = pose.target[2] - pose.pos[2]
      const hl = Math.hypot(hx, hz) || 1
      hx /= hl
      hz /= hl
      const fy = projectToFilm(pose, [hx * COVE_DISTANCE, 0, hz * COVE_DISTANCE])[1]
      document.documentElement.style.setProperty('--studio-cove-end', `${(fy * l.h - l.oy).toFixed(1)}px`)
    }

    return addRenderer(() => {
      const W = window.innerWidth
      const H = window.innerHeight
      if (`${W}x${H}` !== size) {
        size = `${W}x${H}`
        coveAtEnd(W, H)
      }
      const p = useExperienceStore.getState().progress
      const chapter = chapterAt(p)
      const cp = Math.min(1, Math.max(0, (p - chapter.start) / (chapter.end - chapter.start)))
      const pose = cameraAt(chapter.phase, cp)
      const l = filmLayout(W, H, pose, compositionAt(p, layoutMode(W, H), comp))
      const screen = (v: Vec3) => {
        const [fx, fy] = projectToFilm(pose, v)
        return [fx * l.w - l.ox, fy * l.h - l.oy]
      }
      studioLightAt(p, light)

      // the cove: floor and wall meet behind the bag, straight back along the camera's horizontal view direction
      let hx = pose.target[0] - pose.pos[0]
      let hz = pose.target[2] - pose.pos[2]
      const hl = Math.hypot(hx, hz) || 1
      hx /= hl
      hz /= hl
      const coveY = screen([hx * COVE_DISTANCE, 0, hz * COVE_DISTANCE])[1]
      const floorY = coveY - FLOOR_TOP * H
      write(floor, `translate3d(0, ${floorY.toFixed(1)}px, 0)`, 1)
      write(underfloor, `translate3d(0, ${(floorY + FLOOR_HEIGHT * H - 1).toFixed(1)}px, 0)`, 1)
      write(warm, 'none', light.warmth)

      // the floor pool, in perspective
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
      for (const v of circle) {
        const [x, y] = screen(v)
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
      }
      const rx = ((x1 - x0) / 2) * light.poolSize
      const ry = ((y1 - y0) / 2) * light.poolSize
      write(pool, `translate3d(${((x0 + x1) / 2 - GLOW).toFixed(1)}px, ${((y0 + y1) / 2 - GLOW).toFixed(1)}px, 0) scale(${(rx / GLOW).toFixed(4)}, ${(ry / GLOW).toFixed(4)})`, light.pool)

      // the wash on the wall behind the product's upper body
      let bx0 = Infinity, bx1 = -Infinity, by1 = -Infinity
      for (const v of corners) {
        const [x, y] = screen(v)
        bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y)
      }
      const wy = Math.min(coveY, by1) - H * 0.16
      write(wash, `translate3d(${((bx0 + bx1) / 2 - GLOW).toFixed(1)}px, ${(wy - GLOW).toFixed(1)}px, 0) scale(${((W * 0.38) / GLOW).toFixed(4)}, ${((H * 0.52) / GLOW).toFixed(4)})`, light.wash)

      write(windowLight, 'none', light.window)
    }, 5)
  }, [])

  return (
    <div ref={rootRef} className="studio" aria-hidden="true">
      <div className="studio-wall" />
      <div className="studio-floor" />
      <div className="studio-underfloor" />
      <div className="studio-window" />
      <div className="studio-warm" />
      <div className="studio-falloff" />
      <div className="studio-unlit" />
      <div className="studio-pool"><i /></div>
      <div className="studio-wash"><i /></div>
    </div>
  )
}
