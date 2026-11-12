'use client'

import { useProgress } from '@react-three/drei'
import { useExperienceStore } from '@/state/experienceStore'

export default function ModelLoadIndicator() {
  const { active, progress } = useProgress()
  // Only while the live model is what the stage should show (not while the opening's last frame stands in for it). It loads behind the opening frames (ProductScene
  // LIVE_AFTER_READY), and its bar growing under a product already on screen read as a stray line (owner's device video,
  // 2026-11-11).
  const needed = useExperienceStore((s) => !s.stageHeld && !(s.sequenceId && s.sequenceFrameOk && s.sequenceCover >= 0.999))
  const showLoader = needed && active && progress < 100

  return (
    <div className={`model-loader ${showLoader ? 'model-loader--active' : ''}`}>
      <span className="model-loader-fill" style={{ width: `${Math.round(progress)}%` }} />
    </div>
  )
}
