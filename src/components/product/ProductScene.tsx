'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useExperienceStore } from '@/state/experienceStore'
import { ProductFallback } from './ProductFallback'
import { ImageSequence, liveLayerRef } from '@/components/sequence/ImageSequence'
import { trackScrollIdle, whenScrollIdle } from '@/motion/scrollIdle'

const ProductCanvas = dynamic(() => import('./ProductCanvasInner').then((m) => m.ProductCanvasInner), {
  ssr: false,
})

const coarsePointer = () => typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches

/**
 * ms after the intro hands over (`ready`) before the live model mounts: First Light has finished by then. Creating the
 * WebGL context and compiling its shaders holds the GPU thread that the compositor draws every frame with (traced: a
 * 1.1 s context creation plus ~0.5 s of program links at 4x CPU throttle), so mounted at the reveal it froze the
 * product's emergence and the studio light; the opening frames show the product until the hero handover anyway.
 */
const LIVE_AFTER_READY = 1200

const ModelLoadIndicator = dynamic(() => import('./ModelLoadIndicator'), { ssr: false })

/**
 * Two layers framed identically (film layout): the photoreal image sequence and the live 3D canvas underneath.
 * Sequence chapters show the frames and hand over to the interactive model with a cross-fade; if frames are not
 * available the live canvas plays the same camera path and pose on its own.
 */
export function ProductScene() {
  const modelFailed = useExperienceStore((s) => s.modelFailed)
  // detected after mount (Experience.tsx) so the server and first client render agree (no hydration mismatch)
  const webgl = useExperienceStore((s) => s.webglSupported)
  const intro = useExperienceStore((s) => s.introPhase)
  const openingReady = useExperienceStore((s) => s.openingReady)
  // Boolean selectors only: this component re-renders when a layer's state flips, never per scroll frame. (Whether
  // the live scene renders is decided per tick inside the frame loop — see liveLayer.ts.)
  const fallbackVisible = useExperienceStore((s) => {
    const ready = s.sequenceId ? !!s.sequenceReady[s.sequenceId] && s.sequenceFrameOk : false
    return !(s.sequenceId && ready && s.sequenceCover >= 0.999)
  })
  // Hidden through the loader and the logo. From 4 s the stage is shown at full strength underneath the intro overlay,
  // whose backdrop and studio-light iris fade away on the compositor (intro.css) — the product emerges by visibility
  // only, never blurred or re-exposed: the first visible frame is the final full-resolution frame.
  const stageFade = intro === 'loading' || intro === 'logo' || intro === 'outro' ? 0 : 1
  // The live model is first needed at the reveal -> hero handover, so it loads and compiles once the intro has fully
  // handed over (LIVE_AFTER_READY) — its compile can then never stall the loader, the logo or the reveal. If the opening frames are not ready when the logo
  // starts, it mounts at once instead, so it can stand in for them at 4 s — except on touch screens: there its 4 MB
  // download would compete with the few opening frames still missing on a mobile connection, and its texture uploads
  // and shader compiles would land on the logo animation (the GPU is shared with the compositor). Phones wait for the
  // frames instead (IntroSequence maxWait still bounds the wait).
  const [liveDue, setLiveDue] = useState(false)
  useEffect(() => {
    trackScrollIdle()
  }, [])
  useEffect(() => {
    if (intro !== 'ready' || liveDue) return
    // touch screens: then at a pause in the visitor's scrolling, at the latest 1.5 s later (motion/scrollIdle.ts)
    let cancel = () => {}
    const t = window.setTimeout(() => {
      cancel = whenScrollIdle(() => setLiveDue(true), 1500)
    }, LIVE_AFTER_READY)
    return () => {
      window.clearTimeout(t)
      cancel()
    }
  }, [intro, liveDue])
  const revealed = intro === 'product' || intro === 'ready'
  const mountModel =
    liveDue ||
    // the frames could not show the reveal (maxWait): the model stands in for them at once
    (revealed && !openingReady) ||
    (intro !== 'loading' && !openingReady && !coarsePointer())

  return (
    <div className="stage-canvas" style={{ opacity: stageFade, visibility: stageFade <= 0.001 ? 'hidden' : 'visible' }}>
      {/* opacity is written by the frame loop together with the photoreal layer (see liveLayerRef) */}
      <div className="stage-live" ref={(el) => { liveLayerRef.current = el }}>
        {webgl && mountModel && !modelFailed && <ProductCanvas />}
        {(!webgl || modelFailed) && fallbackVisible && (
          <ProductFallback reason={webgl ? 'MODEL FAILED TO LOAD' : 'WEBGL UNAVAILABLE'} />
        )}
      </div>
      <ImageSequence />
      {webgl && mountModel && <ModelLoadIndicator />}
    </div>
  )
}
