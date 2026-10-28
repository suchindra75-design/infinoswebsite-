import { ECOSYSTEM, RELATIONSHIP_LABEL, type EcosystemLogo } from '@/content/ecosystem'
import { Head } from '@/components/sections/PlatformSections'
import { Marquee } from '@/components/sections/Marquee'

/** the logo plate's design size (globals.css `.eco-item` / `.eco-plate`); logo widths are percentages of it */
const PLATE = { w: 208, h: 116 }
/** every logo gets about the same visual area, capped inside the plate — wide wordmarks and square marks balance */
const AREA = 0.29 * PLATE.w * PLATE.h
const MAX = { w: 0.78 * PLATE.w, h: 0.6 * PLATE.h }

function logoWidthPercent(logo: EcosystemLogo): number {
  const r = logo.width / logo.height
  let w = Math.sqrt(AREA * r)
  let h = w / r
  if (w > MAX.w) [w, h] = [MAX.w, MAX.w / r]
  if (h > MAX.h) [w, h] = [MAX.h * r, MAX.h]
  return (w / PLATE.w) * 100
}

function Logo({ logo }: { logo: EcosystemLogo }) {
  return (
    <figure className="eco-item">
      <div className="eco-plate">
        {/* eslint-disable-next-line @next/next/no-img-element -- original logo files, trimmed only (tools/encode_gallery_ecosystem.mjs) */}
        <img
          className="eco-logo"
          data-blend={logo.blend || undefined}
          src={logo.src}
          width={logo.width}
          height={logo.height}
          alt={`${logo.name} logo`}
          style={{ width: `${logoWidthPercent(logo).toFixed(2)}%` }}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </div>
      <figcaption className="eco-cap">
        <span className="eco-name">{logo.name}</span>
        <span className="eco-rel">{RELATIONSHIP_LABEL[logo.relationship]}</span>
      </figcaption>
    </figure>
  )
}

/** Our Ecosystem: the recognition, then the organisations as a second, slower marquee (between Company and Contact) */
export function EcosystemSection() {
  const r = ECOSYSTEM.recognition
  return (
    <section className="sx sx--eco tone-white" id="ecosystem">
      <div className="sx-inner">
        <Head kicker={ECOSYSTEM.kicker} title={ECOSYSTEM.title} lede={ECOSYSTEM.lede} />
        <div className="eco-recognition">
          <p className="eco-recognition-label">{r.label}</p>
          <div>
            <p className="eco-recognition-statement">{r.statement}</p>
            <p className="eco-recognition-detail">{r.detail}</p>
          </div>
        </div>
      </div>
      <Marquee
        className="eco-marquee"
        label="Organisations connected with INFINOS"
        speed={11}
        reducedLayout="wrap"
        controls="pause"
        items={ECOSYSTEM.logos.map((l) => ({ key: l.id, node: <Logo logo={l} /> }))}
      />
      <div className="sx-inner">
        <p className="sx-foot eco-note">{ECOSYSTEM.note}</p>
      </div>
    </section>
  )
}
