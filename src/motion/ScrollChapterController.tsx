'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { applyScrollProgress } from '@/motion/chapters'
import { lenisRef } from '@/motion/SmoothScrollProvider'
import { useExperienceStore } from '@/state/experienceStore'

export function ScrollChapterController({
  targetRef,
}: {
  targetRef: React.RefObject<HTMLDivElement | null>
}) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const el = targetRef.current
    if (!el) return
    // The story moment the visitor was at before any resize began: on rotation the browser rescales the scroll
    // position before the layout switch is reported, and that intermediate position means nothing in either layout.
    const settled = { story: 0, inStory: true }
    let resizedAt = -Infinity
    const onResize = () => {
      resizedAt = performance.now()
    }
    window.addEventListener('resize', onResize)
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const story = self.progress
        if (performance.now() - resizedAt > 500) {
          settled.story = story
          settled.inStory = self.progress < 1
        }
        applyScrollProgress(story)
      },
    })
    applyScrollProgress(trigger.progress)
    // Switching between the phone layout and the others (rotating a phone, resizing a window): the scroll region changes
    // length with it (globals.css), so re-measure, then return the visitor to the same moment of the story. Past the
    // story, only the measurement changes.
    // the moment to return to, kept for a short while: the browser and ScrollTrigger's own resize refresh can both move
    // the page again after the switch, so the position is re-applied after each of those refreshes
    let restore: { story: number; until: number } | null = null
    const reposition = () => {
      if (!restore || performance.now() > restore.until) return
      // measured here, not from the trigger: before its own resize refresh, ScrollTrigger holds the old viewport height
      const p = restore.story
      const start = el.getBoundingClientRect().top + window.scrollY
      const y = start + p * Math.max(0, el.offsetHeight - window.innerHeight)
      if (lenisRef.current) lenisRef.current.scrollTo(y, { immediate: true, force: true })
      else window.scrollTo(0, y)
      applyScrollProgress(p)
    }
    ScrollTrigger.addEventListener('refresh', reposition)
    const unsub = useExperienceStore.subscribe((s, prev) => {
      if (s.phone === prev.phone) return
      restore = settled.inStory ? { story: settled.story, until: performance.now() + 1500 } : null
      // one frame later, once the new viewport is laid out (the media query reports before the layout has changed)
      requestAnimationFrame(() => {
        reposition()
        ScrollTrigger.refresh()
      })
    })
    return () => {
      unsub()
      ScrollTrigger.removeEventListener('refresh', reposition)
      window.removeEventListener('resize', onResize)
      trigger.kill()
    }
  }, [targetRef])

  return null
}
