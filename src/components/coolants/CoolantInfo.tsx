'use client'

import { useEffect, useRef } from 'react'
import { COOLANTS, COOLANT_FAMILY, verifiedFields } from '@/content/coolants'
import { useCoolantStore } from './coolantStore'

const goToContact = (e: React.MouseEvent<HTMLAnchorElement>) => {
  // the same smooth section scroll the navigation uses; the plain #contact anchor still works without it
  const target = document.querySelector(COOLANT_FAMILY.requestHref)
  if (!target) return
  e.preventDefault()
  target.scrollIntoView({ behavior: 'smooth' })
}

/**
 * The coolant showcase's words (phase 2): the family introduction once all three packs have landed, and the selected
 * coolant's information. Visibility follows data attributes written by the section's frame-loop updater
 * (`data-family`, `data-focus` on .cx-stage), so scrolling never re-renders React; this component renders only when
 * the selection changes. Only verified fields from content/coolants.ts are shown — never placeholders.
 */
export function CoolantInfo() {
  const shown = useCoolantStore((s) => s.shown)
  const select = useCoolantStore((s) => s.select)
  const coolant = COOLANTS.find((c) => c.id === shown)
  const rows = coolant ? verifiedFields(coolant) : []
  const bodyRef = useRef<HTMLDivElement>(null)

  // when the verified rows don't fit their column, they scroll inside it: only then is the wheel left to the browser
  // (Lenis skips elements marked data-lenis-prevent-wheel), so the page keeps its smooth scroll everywhere else
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const sync = () => body.toggleAttribute('data-lenis-prevent-wheel', body.scrollHeight > body.clientHeight + 1)
    const ro = new ResizeObserver(sync)
    ro.observe(body)
    for (const child of body.children) ro.observe(child)
    return () => ro.disconnect()
  }, [coolant?.id])

  return (
    <>
      <div className="cx-family">
        <p className="cx-kicker">{COOLANT_FAMILY.kicker}</p>
        <h2 className="cx-family-headline">{COOLANT_FAMILY.headline}</h2>
      </div>

      <section className="cx-info" aria-label="Coolant information" aria-live="polite">
        {coolant && (
          // keyed: switching coolants replays the short entrance, so name and information always change together
          <div key={coolant.id} className="cx-info-inner" style={{ '--cx-c': coolant.ui } as React.CSSProperties}>
            <div className="cx-info-head">
              <button type="button" className="cx-info-back" onClick={() => select(null)}>
                <span aria-hidden="true">←</span> {COOLANT_FAMILY.all}
              </button>
              <p className="cx-kicker cx-info-kicker">
                <i className="cx-swatch" aria-hidden="true" />
                {COOLANT_FAMILY.variantKicker}
              </p>
              <h3 className="cx-info-name">{coolant.name}</h3>
            </div>
            <div className="cx-info-body" ref={bodyRef}>
              <p className="cx-info-line">{COOLANT_FAMILY.memberLine}</p>
              {rows.length > 0 && (
                <dl className="cx-info-rows">
                  {rows.map((r) => (
                    <div className="cx-info-row" key={r.id}>
                      <dt>{r.label}</dt>
                      <dd>{r.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <a className="cx-info-request" href={COOLANT_FAMILY.requestHref} onClick={goToContact}>
                {COOLANT_FAMILY.request}
                <span aria-hidden="true"> →</span>
              </a>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
