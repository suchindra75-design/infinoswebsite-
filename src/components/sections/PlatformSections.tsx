import { APPLICATIONS, COOLANT, FIGURES, IMPACT, INDUSTRIES, INDUSTRY_GROUP, INDUSTRY_NOTE, OTHER_USES, PILLARS, POSITIONING, RANGE, RANGE_NOTE, SDGS, ZONES, type RangeItem } from '@/content/platform'
import { CONTACT } from '@/content/site'
import { COMPANY, type CompanyLink } from '@/content/company'
import { SocialIcon } from '@/components/sections/SocialIcon'
import { CompartmentFigure, CoolantFigure, MonitorFigure, StatusTag } from '@/components/story/Figures'

/**
 * Supporting sections after the product story: everything the story introduces one idea at a time, in full —
 * technology, product range, applications, impact, company and contact. All facts come from content/platform.ts.
 */

/** every external link: a new tab, without handing the opener or the referrer to the other site */
function ExternalLink({ link, className, label, children }: { link: CompanyLink; className?: string; label: string; children: React.ReactNode }) {
  return (
    <a className={className} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`}>
      {children}
    </a>
  )
}

export function Head({ kicker, title, lede, display = false }: { kicker: string; title: React.ReactNode; lede?: string; display?: boolean }) {
  return (
    <header className={`sx-head${display ? ' sx-head--display' : ''}`}>
      <div className="sx-head-main">
        <p className="sx-kicker">{kicker}</p>
        <h2 className="sx-title">{title}</h2>
      </div>
      {lede && <p className="sx-lede">{lede}</p>}
    </header>
  )
}

/** the monitoring chain — only confirmed elements (sensors, monitoring application, chain of custody); no protocols */
function ArchitectureFigure() {
  const nodes = [
    { k: 'Sense', t: 'Sensors', d: 'In the INFINOS container' },
    { k: 'Monitor', t: 'INFINOS monitoring application', d: 'Used together with the sensors' },
    { k: 'Hand over', t: 'Chain of custody', d: 'Functionality for sample handovers' },
    { k: 'Receive', t: 'Laboratory · hospital', d: 'From collection to analysis' },
  ]
  return (
    <figure className="sx-arch" aria-label="Monitoring architecture">
      {nodes.map((n, i) => (
        <div className="sx-arch-node" key={n.k}>
          <span className="sx-arch-step">{String(i + 1).padStart(2, '0')} · {n.k}</span>
          <span className="sx-arch-title">{n.t}</span>
          <span className="sx-arch-detail">{n.d}</span>
        </div>
      ))}
    </figure>
  )
}

/**
 * what INFINOS is: a smart cold-chain and temperature-controlled transportation technology company; the industries its
 * technology is intended for, each marked as current (products developed today) or potential; then the three ideas of
 * the current, diagnostic system that the rest of the site is built on
 */
export function PositioningSection() {
  const current = INDUSTRIES.filter((ind) => ind.scope === 'current')
  const potential = INDUSTRIES.filter((ind) => ind.scope === 'potential')
  return (
    <section className="sx tone-ivory" id="platform">
      <div className="sx-inner">
        <Head
          display
          kicker={POSITIONING.company}
          // keep "cold-chain" on one line (it must not break at its hyphen)
          title={<>Smart <span className="sx-nowrap">cold-chain</span> technology.</>}
          lede={POSITIONING.companyLine}
        />
        {/* industries: what the current products serve, set apart from the potential applications (an index) */}
        <div className="sx-sectors">
          <p className="sx-label sx-sectors-label">Industries</p>
          <div className="sx-sector-current">
            <p className="sx-sector-group">{INDUSTRY_GROUP.current}</p>
            {current.map((ind) => (
              <div key={ind.id} data-scope={ind.scope}>
                <h3 className="sx-sector-lead">{ind.name}</h3>
                <p>{ind.detail}</p>
              </div>
            ))}
          </div>
          <div className="sx-sector-potential">
            <p className="sx-sector-group">{INDUSTRY_GROUP.potential}</p>
            <ol className="sx-sector-index">
              {potential.map((ind, i) => (
                <li key={ind.id} data-scope={ind.scope}>
                  <span className="sx-sector-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="sx-sector-name">{ind.name}</h3>
                  <p>{ind.detail}</p>
                </li>
              ))}
            </ol>
          </div>
          <p className="sx-foot sx-sectors-note">{INDUSTRY_NOTE}</p>
        </div>
        <p className="sx-label">The current INFINOS system · {POSITIONING.currentFocus}</p>
        <ol className="sx-pillars">
          {PILLARS.map((p) => (
            <li key={p.id}>
              <span className="sx-pillar-n">{p.numeral}</span>
              <h3 className="sx-h3">{p.title}</h3>
              <p>{p.detail}</p>
              <a className="sx-pillar-link" href={p.href} onClick={(e) => { e.preventDefault(); document.querySelector(p.href)?.scrollIntoView({ behavior: 'smooth' }) }}>
                Explore
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function TechnologySection() {
  return (
    <section className="sx tone-slate" id="technology">
      <div className="sx-inner">
        <Head
          kicker={`${PILLARS[1].numeral} · ${PILLARS[1].title}`}
          title="Built for the cold chain."
          lede="In today’s INFINOS products, developed for diagnostic sample transport, three layers work together around organised compartments and a two-zone temperature concept: PCM-based thermal management, sensors and the INFINOS monitoring application."
        />

        <div className="sx-row">
          <div className="sx-copy">
            <p className="sx-index">01</p>
            <h3 className="sx-h3">Two-zone temperature concept</h3>
            <p>
              The INFINOS concept includes two temperature zones for different sample categories such as {ZONES.sampleCategories.join(', ')}:{' '}
              {ZONES.zone1.name} at about {ZONES.zone1.temp} in the upper chamber and {ZONES.zone2.name} at an example {ZONES.zone2.temp} in the
              lower.
            </p>
            <StatusTag status="example">−10 °C is an example configuration</StatusTag>{' '}
            <StatusTag status={ZONES.simultaneous}>Simultaneous operation · awaiting validation</StatusTag>
          </div>
          <div className="sx-visual">
            <CompartmentFigure large />
          </div>
        </div>

        <div className="sx-row">
          <div className="sx-copy">
            <p className="sx-index">02</p>
            <h3 className="sx-h3">PCM-based thermal management</h3>
            <p>
              INFINOS thermal management is based on phase-change material (PCM): a pre-filled {COOLANT.volume} bottle of organic or chemical PCM
              coolant, prepared before collection begins.
            </p>
            <p className="sx-note">{COOLANT.durationNote}</p>
            {FIGURES.cooling.publish && (
              <p className="sx-figure-line">
                <span className="sx-figure-value">{FIGURES.cooling.value}</span>
                <span>{FIGURES.cooling.label}</span>
                <StatusTag status={FIGURES.cooling.status} />
              </p>
            )}
          </div>
          <div className="sx-visual">
            <CoolantFigure />
          </div>
        </div>

        <div className="sx-row sx-row--wide">
          <div className="sx-copy">
            <p className="sx-index">03</p>
            <h3 className="sx-h3">Monitoring architecture</h3>
            <p>
              INFINOS brings together sensors, the INFINOS monitoring application and chain-of-custody functionality — from collection
              to the laboratory.
            </p>
          </div>
          <ArchitectureFigure />
        </div>

        <div className="sx-row">
          <div className="sx-copy">
            <p className="sx-index">04</p>
            <h3 className="sx-h3">Sensors &amp; the monitoring application</h3>
            <p>
              INFINOS containers carry sensors, used together with the INFINOS monitoring application. Data logging is part of the Smart
              Diagnostics Flexible Container.
            </p>
          </div>
          <div className="sx-visual">
            <MonitorFigure large />
          </div>
        </div>
      </div>
    </section>
  )
}

function RangeVisual({ item }: { item: RangeItem }) {
  if (item.visual === 'render') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="sx-range-img" src="/images/range-pro.webp" alt={item.name} width={702} height={900} loading="lazy" />
  }
  return (
    <figure className="sx-range-illu">
      {item.visual === 'flexible' ? (
        <svg viewBox="0 0 200 170" aria-hidden="true">
          <path d="M40 60 Q40 46 54 46 H146 Q160 46 160 60 V140 Q160 152 148 152 H52 Q40 152 40 140 Z" className="fx-line" />
          <path d="M40 92 H160" stroke={ZONES.zone1.colour} strokeOpacity="0.6" fill="none" />
          <path d="M72 46 Q72 22 100 22 Q128 22 128 46" className="fx-line" />
          <circle cx="62" cy="72" r="3" className="fx-sensor" />
          <circle cx="62" cy="120" r="3" className="fx-sensor" />
          <path d="M40 60 L28 66 V146 L40 140" className="fx-line fx-line--faint" />
        </svg>
      ) : (
        <svg viewBox="0 0 200 170" aria-hidden="true">
          <rect x="52" y="38" width="96" height="112" rx="8" className="fx-line" />
          <path d="M52 78 H148 M52 112 H148" className="fx-band" strokeWidth="3" fill="none" />
          <rect x="84" y="50" width="32" height="16" rx="3" className="fx-line fx-line--faint" />
          <path d="M148 46 L160 40 V140 L148 150" className="fx-line fx-line--faint" />
        </svg>
      )}
      <figcaption>Illustration</figcaption>
    </figure>
  )
}

export function RangeSection() {
  return (
    <section className="sx tone-graphite sx--range" id="products">
      <div className="sx-inner">
        <Head
          kicker="Product range"
          title="The INFINOS range."
          lede={`${POSITIONING.familyLine} The ${POSITIONING.physical}, shown in the story above and in the 360° view, is one of them.`}
        />
        <div className="sx-range">
          {RANGE.map((item) => (
            <article className={`sx-range-item sx-range-item--${item.id}`} key={item.id}>
              <RangeVisual item={item} />
              <p className="sx-range-role">{item.role}</p>
              <h3 className="sx-h3">{item.name}</h3>
              <p className="sx-range-summary">{item.summary}</p>
              <ul className="sx-points">
                {item.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="sx-foot">{RANGE_NOTE}</p>
      </div>
    </section>
  )
}

export function ApplicationsSection() {
  return (
    <section className="sx tone-ivory" id="applications">
      <div className="sx-inner">
        <Head
          kicker={`${PILLARS[0].numeral} · ${PILLARS[0].title}`}
          title="Wherever samples travel."
          lede="Today’s INFINOS products are developed for healthcare and diagnostics: portable collection and transport for diagnostic samples and other temperature-sensitive healthcare materials — picked up at the patient’s home and carried to the laboratory or hospital."
        />
        <figure className="sx-route" aria-label="Home to laboratory or hospital">
          {['Home collection', 'In transit', 'Laboratory / hospital'].map((s, i) => (
            <span className={`sx-route-stop ${i === 1 ? 'sx-route-stop--mid' : ''}`} key={s}>
              <i />
              {s}
            </span>
          ))}
        </figure>
        <ol className="sx-apps">
          {APPLICATIONS.map((a, i) => (
            <li key={a.id}>
              <span className="sx-index">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="sx-h3">{a.name}</h3>
              <p>{a.detail}</p>
            </li>
          ))}
        </ol>
        <p className="sx-foot">{OTHER_USES}</p>
      </div>
    </section>
  )
}

export function ImpactSection() {
  return (
    <section className="sx tone-white" id="impact">
      <div className="sx-inner">
        <Head
          kicker={`${PILLARS[2].numeral} · ${PILLARS[2].title}`}
          title="Integrity, sustainability, access."
          lede="In today’s diagnostic products, INFINOS aims to protect sample integrity, move samples with less single-use waste and extend diagnostic collection — aligned with three UN Sustainable Development Goals."
        />
        <div className="sx-impact">
          {IMPACT.map((item) => {
            const f = item.figure && FIGURES[item.figure].publish ? FIGURES[item.figure] : null
            return (
              <article key={item.id} className="sx-impact-item">
                {f && (
                  <p className="sx-figure-line">
                    <span className="sx-figure-value">{f.value}</span>
                    <span>{f.label}</span>
                    <StatusTag status={f.status} />
                  </p>
                )}
                <h3 className="sx-h3">{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            )
          })}
        </div>
        <div className="sx-sdgs" aria-label="UN Sustainable Development Goals">
          {SDGS.map((g) => (
            <div className="sx-sdg" key={g.n}>
              <span className="sx-sdg-n">SDG {g.n}</span>
              <span className="sx-sdg-t">{g.title}</span>
            </div>
          ))}
        </div>
        <p className="sx-foot">
          The ~500 t figure is a projection at scale from INFINOS planning material, not an achieved result. Performance figures are published
          only once supporting test evidence is available.
        </p>
      </div>
    </section>
  )
}

export function CompanySection() {
  return (
    <section className="sx tone-ivory" id="company">
      <div className="sx-inner">
        <Head
          kicker="Company"
          title={POSITIONING.company}
          lede={`${POSITIONING.companyLine} ${POSITIONING.currentLine}`}
        />
        <dl className="sx-meta">
          <div>
            <dt>Company</dt>
            <dd>{POSITIONING.legalName}</dd>
          </div>
          <div>
            <dt>Focus</dt>
            <dd>{POSITIONING.category}</dd>
          </div>
          <div>
            <dt>Current products</dt>
            <dd>{POSITIONING.currentFocus}</dd>
          </div>
          <div>
            <dt>Web</dt>
            <dd>
              <a href={CONTACT.websiteUrl} rel="noopener">{CONTACT.website}</a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

export function ContactSection() {
  return (
    <section className="sx sx--contact tone-graphite" id="contact">
      <div className="sx-inner">
        <p className="sx-kicker">Contact</p>
        <h2 className="sx-title sx-title--big">Talk to INFINOS.</h2>
        <p className="sx-lede">Healthcare and diagnostics teams, and businesses that move temperature-sensitive products: get in touch about pilots, deployment and new applications.</p>
        <a className="sx-contact-link" href={`mailto:${CONTACT.email}`}>
          {CONTACT.email}
        </a>
        <p className="sx-contact-more">
          <a href={`mailto:${CONTACT.altEmail}`}>{CONTACT.altEmail}</a>
          <span aria-hidden="true">·</span>
          <a href={CONTACT.websiteUrl} rel="noopener">{CONTACT.website}</a>
        </p>
        {/* official social accounts, and the business listing kept apart from them (content/company.ts) */}
        <dl className="sx-contact-links">
          {COMPANY.social.length > 0 && (
            <div>
              <dt>Follow INFINOS</dt>
              <dd>
                <ul className="sx-social">
                  {COMPANY.social.map((l) => (
                    <li key={l.id}>
                      <ExternalLink link={l} label={`INFINOS on ${l.name ?? l.label}`}>
                        <SocialIcon id={l.id} />
                        <span className="sx-social-label">{l.label}</span>
                      </ExternalLink>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {COMPANY.listings.length > 0 && (
            <div>
              <dt>Business listing</dt>
              <dd>
                <ul className="sx-social">
                  {COMPANY.listings.map((l) => (
                    <li key={l.id}>
                      <ExternalLink link={l} label={`INFINOS on ${l.label}, business listing`}>
                        <span className="sx-social-label">{l.label}</span>
                        <span aria-hidden="true">↗</span>
                      </ExternalLink>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </div>
      <footer className="sx-footer">
        <span>© {new Date().getFullYear()} {POSITIONING.legalName}</span>
        {COMPANY.social.length > 0 && (
          <ul className="sx-footer-social" aria-label="INFINOS on social media">
            {COMPANY.social.map((l) => (
              <li key={l.id}>
                <ExternalLink link={l} label={`INFINOS on ${l.name ?? l.label}`}>
                  <SocialIcon id={l.id} />
                </ExternalLink>
              </li>
            ))}
          </ul>
        )}
        <span>{POSITIONING.tagline}</span>
      </footer>
    </section>
  )
}
