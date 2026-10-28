'use client'

import { useSyncExternalStore } from 'react'
import { GALLERY, type GalleryPhoto } from '@/content/gallery'
import { Head } from '@/components/sections/PlatformSections'
import { Marquee } from '@/components/sections/Marquee'

// review mode (?review=photos) also shows photographs whose publication consent is still pending (content/gallery.ts)
const getReview = () => new URLSearchParams(window.location.search).get('review') === 'photos'
const getReviewOnServer = () => false
const subscribeNever = () => () => {}

function Photo({ photo, review }: { photo: GalleryPhoto; review: boolean }) {
  return (
    <figure className="gx-item">
      <div className="gx-frame">
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-encoded WebP (tools/encode_gallery_ecosystem.mjs) */}
        <img
          className="gx-img"
          src={photo.src}
          width={photo.width}
          height={photo.height}
          alt={photo.alt}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        {review && photo.consent === 'pending' && <span className="gx-pending">Consent pending · not published</span>}
      </div>
      {photo.caption && <figcaption className="gx-cap">{photo.caption}</figcaption>}
    </figure>
  )
}

/**
 * INFINOS in Action: the photographs as one row (after the product range). Each photo appears once (loop={false}):
 * a still, centred pair where both fit; on narrower screens a slow glide between the two.
 */
export function GallerySection() {
  const review = useSyncExternalStore(subscribeNever, getReview, getReviewOnServer)
  const photos = GALLERY.photos.filter((p) => p.consent !== 'pending' || review)
  if (photos.length === 0) return null
  return (
    <section className="sx sx--gallery tone-slate" id="in-action">
      <div className="sx-inner">
        <Head kicker={GALLERY.kicker} title={GALLERY.title} lede={GALLERY.lede} />
      </div>
      <Marquee
        className="gx"
        label="INFINOS in action: photographs"
        speed={14}
        reducedLayout="scroll"
        controls="steps"
        loop={false}
        items={photos.map((p) => ({ key: p.id, node: <Photo photo={p} review={review} /> }))}
      />
    </section>
  )
}
