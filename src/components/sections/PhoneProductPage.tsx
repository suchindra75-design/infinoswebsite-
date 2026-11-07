'use client'

import { useState } from 'react'
import { STORY } from '@/content/story'
import { ZONES } from '@/content/platform'
import { COOLANTS, COOLANT_FAMILY, COOLANT_STILLS, type CoolantId } from '@/content/coolants'
import { openProductViewer } from '@/components/viewer/ProductViewer'
import { lenisRef } from '@/motion/SmoothScrollProvider'
import { useExperienceStore } from '@/state/experienceStore'

/**
 * Phones only (approved mobile concept C, "Product page first"; motion/phoneLayout.ts). The short scroll story ends
 * inside the open sequence; what follows reads like a product page: a swipeable feature reel of every chapter (the
 * later chapters are no longer scrolled through on phones), the temperature-zone figure with a short fact list, and the
 * coolant family as a light, static block in place of the 3D showcase. All copy and every value comes from src/content
 * (no new claims); images are the real Cycles frames and the coolant stills.
 */

/** reel image per chapter: a real frame or still, framed on the bag (zoom about the subject point, as fractions) */
const REEL: Record<string, { src: string; zoom: number; x: number; y: number }> = {
  architecture: { src: '/sequences/reveal/mobile/0071.webp', zoom: 2.2, x: 50, y: 52 },
  cooling: { src: '/sequences/open/mobile/0030.webp', zoom: 1.9, x: 50, y: 50 },
  compartments: { src: '/sequences/open/mobile/0090.webp', zoom: 1.8, x: 50, y: 52 },
  monitoring: { src: '/sequences/open/mobile/0119.webp', zoom: 1.8, x: 50, y: 48 },
  sustainability: { src: COOLANT_STILLS.family, zoom: 1.15, x: 50, y: 50 },
  safety: { src: '/sequences/reveal/mobile/0030.webp', zoom: 2.6, x: 54, y: 50 },
  system: { src: '/images/range-pro.webp', zoom: 1, x: 50, y: 60 },
}

/** fact list: each line restates the story's own wording (src/content/story.ts) */
const FACTS: [string, string][] = [
  ['Cooling', 'PCM-based thermal management'],
  ['Compartments', 'Upper chamber, lower chamber, removable inner box'],
  ['Monitoring', 'Sensors and a monitoring application'],
  ['Chain of custody', 'For sample handovers'],
]

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -64 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

export function PhoneProductPage() {
  const reel = STORY.filter((c) => c.index !== '01')
  const zoneChapter = STORY.find((c) => c.id === 'architecture')
  const [coolant, setCoolant] = useState<CoolantId | null>(null)
  const zones = [ZONES.zone1, ZONES.zone2]

  return (
    <>
      <section className="pp tone-ivory" id="features" aria-labelledby="pp-features-title">
        <p className="pp-kicker" id="pp-features-title">What it does</p>
        <ol className="pp-reel" aria-label="INFINOS features, swipe for more">
          {reel.map((c) => {
            const im = REEL[c.id]
            return (
              <li className="pp-card" key={c.id}>
                {im && (
                  <div className="pp-card-im">
                    <img
                      src={im.src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      style={{ objectPosition: `${im.x}% ${im.y}%`, transform: `scale(${im.zoom})`, transformOrigin: `${im.x}% ${im.y}%` }}
                    />
                  </div>
                )}
                <p className="pp-card-index">
                  {c.index} · {c.name}
                </p>
                <h3 className="pp-card-title">{c.headline}</h3>
                <p className="pp-card-body">{c.body}</p>
              </li>
            )
          })}
        </ol>
      </section>

      {zoneChapter && (
        <section className="pp tone-ivory" aria-labelledby="pp-zones-title">
          <p className="pp-kicker">{zoneChapter.name}</p>
          <h2 className="pp-title" id="pp-zones-title">
            {zoneChapter.headline}
          </h2>
          <div className="pp-zones">
            {zones.map((z) => (
              <div className="pp-zone" key={z.name}>
                <p className="pp-zone-name">
                  <i style={{ background: z.colour }} aria-hidden="true" />
                  {z.name}
                </p>
                <p className="pp-zone-temp">
                  {z.prefix} {z.temp}
                </p>
                <p className="pp-zone-chamber">{z.chamber}</p>
              </div>
            ))}
          </div>
          <p className="pp-text">For different sample categories, such as {ZONES.sampleCategories.join(', ').replace(/, ([^,]*)$/, ' and $1')}.</p>
          {zoneChapter.note && <p className="pp-note">{zoneChapter.note}</p>}
          <dl className="pp-facts">
            {FACTS.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="pp tone-ivory" id="coolants" aria-labelledby="pp-coolants-title">
        <p className="pp-kicker">{COOLANT_FAMILY.kicker}</p>
        <h2 className="pp-title" id="pp-coolants-title">
          {COOLANT_FAMILY.headline}
        </h2>
        <div className="pp-coolant-im">
          <img src={COOLANT_STILLS[coolant ?? 'family']} alt="The three INFINOS coolant packs" loading="lazy" decoding="async" />
        </div>
        <div className="pp-chips" role="group" aria-label={COOLANT_FAMILY.hint}>
          {COOLANTS.map((c) => (
            <button
              type="button"
              key={c.id}
              className="pp-chip"
              aria-pressed={coolant === c.id}
              onClick={() => setCoolant(coolant === c.id ? null : c.id)}
            >
              <i style={{ background: c.ui }} aria-hidden="true" />
              {c.name}
            </button>
          ))}
        </div>
        <button type="button" className="pp-link" onClick={() => scrollToId('contact')}>
          {COOLANT_FAMILY.request} →
        </button>
      </section>
    </>
  )
}

/** Phones: Contact and the 360° view, one tap away on every screen once the intro has finished. */
export function PhoneActionBar() {
  const shown = useExperienceStore((s) => s.introPhase === 'ready' && !s.viewerOpen && !s.menuOpen)
  return (
    <div className={`pp-bar ${shown ? 'pp-bar--shown' : ''}`} aria-hidden={!shown}>
      <button type="button" className="pp-bar-btn" tabIndex={shown ? undefined : -1} onClick={() => scrollToId('contact')}>
        Contact
      </button>
      <button
        type="button"
        className="pp-bar-btn pp-bar-btn--primary"
        tabIndex={shown ? undefined : -1}
        onClick={(e) => openProductViewer(e.currentTarget)}
        aria-haspopup="dialog"
      >
        Explore in 360°
      </button>
    </div>
  )
}
