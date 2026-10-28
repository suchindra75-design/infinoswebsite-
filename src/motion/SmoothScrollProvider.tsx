'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useExperienceStore } from '@/state/experienceStore'

/** the live Lenis instance (null in reduced-motion mode), so overlays such as the 360° viewer can pause scrolling */
export const lenisRef: { current: Lenis | null } = { current: null }

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useExperienceStore((s) => s.reducedMotion)

  useEffect(() => {
    if (reducedMotion) return
    gsap.registerPlugin(ScrollTrigger)
    const lenis = new Lenis({ lerp: 0.11 })
    lenisRef.current = lenis
    // the timed intro owns the first seconds: scrolling starts paused until it reports `ready` (IntroSequence)
    if (useExperienceStore.getState().introPhase !== 'ready') lenis.stop()
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    // prioritised: Lenis -> ScrollTrigger -> store run first in every frame, then the shared frame loop
    // (motion/frameLoop.ts) draws text, frames and 3D for that same scroll position
    gsap.ticker.add(raf, false, true)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      if (lenisRef.current === lenis) lenisRef.current = null
    }
  }, [reducedMotion])

  return <>{children}</>
}
