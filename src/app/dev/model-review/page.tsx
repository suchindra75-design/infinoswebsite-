import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import ModelReview from './ModelReview'

/** Dev-only model QA view: photo-matched cameras + open/exploded poses. Not available in production builds. */
export default function ModelReviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <Suspense fallback={null}>
      <ModelReview />
    </Suspense>
  )
}
