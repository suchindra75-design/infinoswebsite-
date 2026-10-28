/**
 * "INFINOS in Action" — the gallery's photographs (owner-supplied, 2026-10-15; encoded by
 * tools/encode_gallery_ecosystem.mjs from tools/assets/gallery/).
 *
 * PUBLICATION RULE (owner, 2026-10-16): publication consent for the identifiable people in the photographs is not
 * confirmed, so the public gallery shows only crops without identifiable people (`consent: 'not-required'`). A photo
 * with identifiable people may be listed only once its consent is 'confirmed'; until then a 'pending' entry appears
 * only in review mode (`?review=photos`), marked "Consent pending". The full photographs are not in the website build
 * at all (they stay in tools/assets/gallery/). Before launch: docs/LAUNCH_CHECKLIST.md and `npm run launch-check`.
 *
 * Captions only where the context is known (owner); no people are named and no event details are added.
 */
export type Consent = 'not-required' | 'pending' | 'confirmed'

export interface GalleryPhoto {
  id: string
  src: string
  width: number
  height: number
  alt: string
  caption?: string
  consent: Consent
  /** why the photo may (or may not yet) be published */
  consentNote: string
}

const photo = (id: string, width: number, height: number, rest: Omit<GalleryPhoto, 'id' | 'src' | 'width' | 'height'>): GalleryPhoto => ({
  id,
  src: `/images/gallery/${id}.webp`,
  width,
  height,
  ...rest,
})

export const GALLERY = {
  kicker: 'Gallery',
  title: 'INFINOS in action.',
  lede: 'Product demonstrations and visits.',
  photos: [
    photo('cargomen-demonstration-crop', 600, 360, {
      alt: 'Two INFINOS temperature-controlled bags held up at a product demonstration in front of a Cargomen Logistics backdrop, with a desk globe in front.',
      caption: 'Product demonstration · Cargomen Logistics',
      consent: 'not-required',
      consentNote: 'Crop from chest height down: the bags, the hands holding them and the globe; no faces or heads.',
    }),
    photo('smart-city-living-lab-crop', 417, 250, {
      alt: 'The Smart City Living Lab: a screen reading "Smart City Living Lab" beside a lit shelf of devices.',
      caption: 'Smart City Living Lab',
      consent: 'not-required',
      consentNote: 'Crop of the screen and the device shelf, above everyone’s head; no people.',
    }),
  ] satisfies GalleryPhoto[],
}
