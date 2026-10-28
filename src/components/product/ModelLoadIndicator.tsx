'use client'

import { useProgress } from '@react-three/drei'

export default function ModelLoadIndicator() {
  const { active, progress } = useProgress()
  const showLoader = active && progress < 100

  return (
    <div className={`model-loader ${showLoader ? 'model-loader--active' : ''}`}>
      <span className="model-loader-fill" style={{ width: `${Math.round(progress)}%` }} />
    </div>
  )
}
