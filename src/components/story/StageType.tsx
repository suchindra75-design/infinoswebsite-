'use client'

import { useEffect, useRef } from 'react'
import { STORY } from '@/content/story'
import { STORY_RANGES } from '@/motion/chapters'
import { layoutMode } from '@/motion/composition'
import { addRenderer } from '@/motion/frameLoop'
import { smoothstep } from '@/motion/sequences'
import { useExperienceStore } from '@/state/experienceStore'
import { stageSize } from '@/hooks/environment'
import { chapterVisibility } from './StoryOverlay'

/**
 * Type set behind the product, on phones: between the studio and the product layers, so the bag stands in front of it.
 * Two chapters only — the opening (03, over the letters PCM: the thermal management the chapter is about) and the
 * statement (06, whose headline is set here at display size; the overlay keeps it for assistive technology). It is
 * decoration (aria-hidden), driven by the same frame loop and progress as the rest of the story.
 */
const IMMERSIVE = STORY.findIndex((c) => c.phone === 'immersive')
const STATEMENT = STORY.findIndex((c) => c.phone === 'statement')
const STATEMENT_LINES = ['Reusable', 'cold.', 'Less', 'waste.']

export function StageType() {
  const pcmRef = useRef<HTMLParagraphElement>(null)
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([])
  const statementRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
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
    return addRenderer(() => {
      const { W, H } = stageSize()
      const st = useExperienceStore.getState()
      const phone = layoutMode(W, H) === 'phone' && st.introPhase === 'ready'
      const p = st.progress

      // 03: the letters rise slowly behind the opening bag (a slower drift than the product's own movement)
      {
        const r = STORY_RANGES[IMMERSIVE]
        const v = chapterVisibility(IMMERSIVE, p, true)
        const t = Math.min(1, Math.max(0, (p - r.start) / (r.end - r.start)))
        write(pcmRef.current, phone ? v.opacity : 0, `translate3d(-50%, ${(6 - 14 * t).toFixed(2)}vh, 0)`)
      }

      // 06: the four words slide in from the left edge one after another, and lift away together
      {
        const r = STORY_RANGES[STATEMENT]
        const v = chapterVisibility(STATEMENT, p, true)
        write(statementRef.current, phone ? v.fadeOut : 0, `translate3d(0, ${(-(1 - v.fadeOut) * 40).toFixed(1)}px, 0)`)
        const span = Math.max(0.0001, r.end - r.start)
        STATEMENT_LINES.forEach((_, k) => {
          const enter = r.start + span * (0.02 + k * 0.05)
          const e = phone ? smoothstep(enter, enter + span * 0.16, p) : 0
          write(lineRefs.current[k], e, `translate3d(${((1 - e) * -48).toFixed(1)}px, 0, 0)`)
        })
      }
    }, 9)
  }, [])

  return (
    <div className="stage-type" aria-hidden="true">
      <p ref={pcmRef} className="stage-type-pcm" style={{ opacity: 0, visibility: 'hidden' }}>PCM</p>
      <p ref={statementRef} className="stage-type-statement" style={{ opacity: 0, visibility: 'hidden' }}>
        {STATEMENT_LINES.map((l, k) => (
          <span key={l} ref={(el) => { lineRefs.current[k] = el }} style={{ opacity: 0 }}>
            {l}
          </span>
        ))}
      </p>
    </div>
  )
}
