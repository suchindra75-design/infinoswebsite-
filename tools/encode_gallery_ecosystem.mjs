// node tools/encode_gallery_ecosystem.mjs — encodes the gallery photographs and the ecosystem logos for the website.
// Sources (tools/assets/) are the owner-supplied photographs and the original logo files from the previous INFINOS
// website, unchanged. Photos: WebP at 560 and 1080 px wide (never upscaled), metadata stripped. Logos: PNG, only
// trimmed to their own artwork (empty margins removed) and, for Amrita TBI, the "amrita tbi" mark taken from the
// banner without its "Funded by" text (owner label: institutional support, subject to confirmation). Nothing is
// redrawn, recoloured or stretched.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const SRC = 'tools/assets'
const OUT = 'public/images'
mkdirSync(`${OUT}/gallery`, { recursive: true })
mkdirSync(`${OUT}/ecosystem`, { recursive: true })

// Public gallery: only crops without identifiable people (owner, 2026-10-16: publication consent for the people in
// the photographs is not confirmed). The full photographs stay in tools/assets/gallery/ and are NOT encoded into the
// website until consent is confirmed. Rejected: product-presentation (the bag is ~80x60 px beside the presenter's
// face) and group-mural (people across the frame; above them only a third party's branded mural).
// Both crops are 5:3, so the gallery shows them as an equal pair; quality 90, because they are shown near (or a
// little above) their native size.
const CROPS = [
  // the two INFINOS bags held up, the hands holding them and the desk globe — from chest height down, no faces
  { id: 'cargomen-demonstration-crop', file: 'cargomen-demonstration.jpg', extract: { left: 200, top: 425, width: 600, height: 360 } },
  // the "Smart City Living Lab" screen (whole) and the lit device shelf — above everyone's head
  { id: 'smart-city-living-lab-crop', file: 'smart-city-living-lab.jpg', extract: { left: 645, top: 58, width: 417, height: 250 } },
]
for (const c of CROPS) {
  const info = await sharp(`${SRC}/gallery/${c.file}`).rotate().extract(c.extract).webp({ quality: 90, effort: 6 }).toFile(`${OUT}/gallery/${c.id}.webp`)
  console.log(`gallery ${c.id}.webp ${info.width}x${info.height} ${Math.round(info.size / 1024)} KB`)
}

const logos = [
  { id: 'startup-india', file: 'startup-india.png', trim: { background: '#ffffff00', threshold: 8 } },
  { id: 'amrita-tbi', file: 'amrita-tbi-banner.jpg', extract: { left: 0, top: 0, width: 101, height: 99 } },
  { id: 'agnii', file: 'agnii.jpg', trim: { background: '#ffffff', threshold: 24 } },
  { id: 'astromerge', file: 'astromerge.png', trim: { background: '#ffffff00', threshold: 8 }, maxWidth: 640 },
  { id: 'lunar-mission-one', file: 'lunar-mission-one.png' },
  { id: 'wh-plus', file: 'wh-plus.png', trim: { background: '#ffffff', threshold: 24 } },
  // a photographic JPEG original: WebP keeps it small without visible loss
  { id: 'heliox-cosmos', file: 'heliox-cosmos.jpg', trim: { background: '#ffffff', threshold: 24 }, webp: true },
]
for (const l of logos) {
  let img = sharp(`${SRC}/ecosystem/${l.file}`).rotate()
  if (l.extract) img = img.extract(l.extract)
  if (l.trim) img = sharp(await img.png().toBuffer()).trim(l.trim)
  if (l.maxWidth) img = sharp(await img.png().toBuffer()).resize({ width: l.maxWidth, withoutEnlargement: true })
  const ext = l.webp ? 'webp' : 'png'
  const info = await (l.webp ? img.webp({ quality: 92 }) : img.png({ compressionLevel: 9 })).toFile(`${OUT}/ecosystem/${l.id}.${ext}`)
  console.log(`logo ${l.id}.${ext} ${info.width}x${info.height} ${Math.round(info.size / 1024)} KB`)
}
