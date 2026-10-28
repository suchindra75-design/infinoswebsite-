'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { applyScrollProgress } from '@/motion/chapters'

export function ScrollChapterController({
  targetRef,
}: {
  targetRef: React.RefObject<HTMLDivElement | null>
}) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const el = targetRef.current
    if (!el) return
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => applyScrollProgress(self.progress),
    })
    applyScrollProgress(trigger.progress)
    return () => trigger.kill()
  }, [targetRef])

  return null
}
