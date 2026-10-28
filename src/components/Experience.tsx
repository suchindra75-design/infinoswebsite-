'use client'

import { useEffect, useRef } from 'react'
import { SmoothScrollProvider } from '@/motion/SmoothScrollProvider'
import { ScrollChapterController } from '@/motion/ScrollChapterController'
import { IntroSequence } from '@/components/hero/IntroSequence'
import { StoryOverlay } from '@/components/story/StoryOverlay'
import { Nav } from '@/components/navigation/Nav'
import { ProductStage } from '@/components/product/ProductStage'
import { ApplicationsSection, CompanySection, ContactSection, ImpactSection, PositioningSection, RangeSection, TechnologySection } from '@/components/sections/PlatformSections'
import { GallerySection } from '@/components/sections/GallerySection'
import { EcosystemSection } from '@/components/sections/EcosystemSection'
import { useExperienceStore } from '@/state/experienceStore'
import { isMobileViewport, prefersReducedMotion, supportsWebGL } from '@/hooks/environment'
import { ProductViewer, ViewerLauncher } from '@/components/viewer/ProductViewer'
import { CoolantShowcase } from '@/components/coolants/CoolantShowcase'
import { applyScrollProgress, chapterAt, computeStages, computeExplodedAmount } from '@/motion/chapters'
import { cameraAt } from '@/motion/cameraTrack'
import { filmLayout, projectToFilm } from '@/motion/sequences'
import { compositionAt, layoutMode } from '@/motion/composition'

export function Experience() {
  const narrativeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    useExperienceStore.setState({
      reducedMotion: prefersReducedMotion(),
      isMobile: isMobileViewport(),
      webglSupported: supportsWebGL(),
    })
    // development-only test hook: the timeline is pure, so QA can sample it exactly (stripped from production builds)
    if (process.env.NODE_ENV !== 'production') {
      Object.assign(window, {
        __infinos: { applyScrollProgress, chapterAt, computeStages, computeExplodedAmount, cameraAt, filmLayout, projectToFilm, compositionAt, layoutMode, store: useExperienceStore },
      })
    }
  }, [])

  return (
    <SmoothScrollProvider>
      <IntroSequence />
      <Nav />
      <ProductStage />
      <StoryOverlay />
      <ViewerLauncher />
      <ProductViewer />
      <div ref={narrativeRef} className="narrative-spacer" aria-hidden="true" />
      <ScrollChapterController targetRef={narrativeRef} />
      {/* the coolant showcase follows the main product animation */}
      <CoolantShowcase />
      <main className="site-content">
        {/* the three central ideas, in order: transportation (applications) · technology · impact — then the range */}
        <PositioningSection />
        <ApplicationsSection />
        <TechnologySection />
        <ImpactSection />
        <RangeSection />
        {/* the gallery follows the product range; the ecosystem sits between the company and contact */}
        <GallerySection />
        <CompanySection />
        <EcosystemSection />
        <ContactSection />
      </main>
    </SmoothScrollProvider>
  )
}
