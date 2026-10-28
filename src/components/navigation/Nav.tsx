'use client'

import { useEffect, useState } from 'react'
import { NAV_LINKS, BRAND } from '@/content/site'
import { useExperienceStore } from '@/state/experienceStore'
import { openProductViewer } from '@/components/viewer/ProductViewer'

export function Nav() {
  const intro = useExperienceStore((s) => s.introPhase)
  const menuOpen = useExperienceStore((s) => s.menuOpen)
  const setMenuOpen = useExperienceStore((s) => s.setMenuOpen)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // the navigation appears once the intro has handed over to the product story
  const navVisible = intro === 'ready'

  const goTo = (href: string, narrative: boolean) => {
    setMenuOpen(false)
    if (narrative) {
      window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' })
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <header
        className={`nav ${navVisible ? 'nav--visible' : ''} ${scrolled ? 'nav--scrolled' : ''}`}
      >
        <button className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.jpg" alt="" width={28} height={28} />
          <span>
            {BRAND.name}
            <span className="nav-brand-suffix"> {BRAND.suffix}</span>
          </span>
        </button>

        <nav className="nav-links" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <button key={link.label} className="nav-link" onClick={() => goTo(link.href, link.narrative)}>
              {link.label}
            </button>
          ))}
          <button className="nav-link nav-link--viewer" onClick={(e) => openProductViewer(e.currentTarget)} aria-haspopup="dialog">
            360° VIEW
          </button>
        </nav>

        <button
          className={`nav-burger ${menuOpen ? 'nav-burger--open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>
      </header>

      <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`}>
        <nav className="mobile-menu-links" aria-label="Mobile">
          {NAV_LINKS.map((link, i) => (
            <button
              key={link.label}
              className="mobile-menu-link"
              style={{ transitionDelay: menuOpen ? `${0.06 + i * 0.05}s` : '0s' }}
              onClick={() => goTo(link.href, link.narrative)}
            >
              <span className="mobile-menu-index">0{i + 1}</span>
              {link.label}
            </button>
          ))}
          <button
            className="mobile-menu-link"
            style={{ transitionDelay: menuOpen ? `${0.06 + NAV_LINKS.length * 0.05}s` : '0s' }}
            onClick={(e) => {
              setMenuOpen(false)
              openProductViewer(e.currentTarget)
            }}
            aria-haspopup="dialog"
          >
            <span className="mobile-menu-index">360</span>
            360° VIEW
          </button>
        </nav>
        <div className="mobile-menu-foot">INFINOS TECH — {BRAND.tagline.toUpperCase()}</div>
      </div>
    </>
  )
}
