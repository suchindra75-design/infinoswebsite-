'use client'

import dynamic from 'next/dynamic'
import { useExperienceStore } from '@/state/experienceStore'
import { ProductFallback } from './ProductFallback'
import { ImageSequence, liveLayerRef } from '@/components/sequence/ImageSequence'

const ProductCanvas = dynamic(() => import('./ProductCanvasInner').then((m) => m.ProductCanvasInner), {
  ssr: false,
})

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
  // The live model is first needed at the reveal -> hero handover, so it loads and compiles from the product reveal
  // on (its compile can then never stall the loader or the logo). If the opening frames are not ready when the logo
  // starts, it mounts at once instead, so it can stand in for them at 4 s.
  const mountModel = intro === 'product' || intro === 'ready' || (intro !== 'loading' && !openingReady)

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
