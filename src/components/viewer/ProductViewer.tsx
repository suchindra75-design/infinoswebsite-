'use client'

/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useExperienceStore } from '@/state/experienceStore'
import { useViewerStore, type ViewName } from '@/state/viewerStore'
import { lenisRef } from '@/motion/SmoothScrollProvider'

const ViewerCanvas = dynamic(() => import('./ViewerCanvas'), { ssr: false })

const VIEW_BUTTONS: { view: ViewName; label: string }[] = [
  { view: 'front', label: 'FRONT' },
  { view: 'right', label: 'RIGHT' },
  { view: 'rear', label: 'REAR' },
  { view: 'left', label: 'LEFT' },
  { view: 'top', label: 'TOP' },
]

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => void }
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void }

/** Opens the dedicated viewer; remembers which element opened it so focus can return there. */
let opener: HTMLElement | null = null
let savedScroll = 0

export function openProductViewer(from?: HTMLElement | null) {
  if (useExperienceStore.getState().viewerOpen) return
  opener = from ?? (document.activeElement as HTMLElement | null)
  savedScroll = window.scrollY
  lenisRef.current?.stop()
  document.documentElement.classList.add('viewer-lock')
  useExperienceStore.getState().setViewerOpen(true)
}

function closeProductViewer() {
  const doc = document as FsDocument
  if (doc.fullscreenElement) void document.exitFullscreen()
  else if (doc.webkitFullscreenElement) doc.webkitExitFullscreen?.()
  useExperienceStore.getState().setViewerOpen(false)
  useViewerStore.getState().setAutoRotate(false)
  document.documentElement.classList.remove('viewer-lock')
  // the page never moved underneath, but restore explicitly (Lenis and the browser can both nudge it)
  window.scrollTo(0, savedScroll)
  lenisRef.current?.scrollTo(savedScroll, { immediate: true, force: true })
  lenisRef.current?.start()
  opener?.focus({ preventScroll: true })
}

/** Floating launcher, visible on the whole site. */
export function ViewerLauncher() {
  const open = useExperienceStore((s) => s.viewerOpen)
  // the floating button belongs to the product story; past its end, chapter 08's CTA and the navigation offer the view
  const pastStory = useExperienceStore((s) => s.progress >= 0.995)
  return (
    <button
      type="button"
      className={`viewer-launch ${open || pastStory ? 'viewer-launch--hidden' : ''}`}
      tabIndex={pastStory ? -1 : undefined}
      onClick={(e) => openProductViewer(e.currentTarget)}
      aria-haspopup="dialog"
    >
      <span className="viewer-launch-icon" aria-hidden="true">
        ⟲
      </span>
      360° VIEW
    </button>
  )
}

export function ProductViewer() {
  const open = useExperienceStore((s) => s.viewerOpen)
  const webgl = useExperienceStore((s) => s.webglSupported)
  const { autoRotate, heading, send, setAutoRotate } = useViewerStore()
  const rootRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus({ preventScroll: true })
    const onFs = () => {
      const doc = document as FsDocument
      setFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFs)
    document.addEventListener('webkitfullscreenchange', onFs)
    return () => {
      document.removeEventListener('fullscreenchange', onFs)
      document.removeEventListener('webkitfullscreenchange', onFs)
    }
  }, [open])

  const toggleFullscreen = useCallback(() => {
    const doc = document as FsDocument
    const el = rootRef.current as FsElement | null
    if (!el) return
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      if (document.exitFullscreen) void document.exitFullscreen()
      else doc.webkitExitFullscreen?.()
    } else if (el.requestFullscreen) void el.requestFullscreen()
    else el.webkitRequestFullscreen?.()
  }, [])

  // keyboard: arrows rotate, +/- zoom, R reset, A auto-rotate, F fullscreen, Esc close (Esc first leaves fullscreen)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!(document as FsDocument).fullscreenElement) closeProductViewer()
      } else if (e.key === 'ArrowLeft') send({ type: 'rotate', by: -Math.PI / 8 })
      else if (e.key === 'ArrowRight') send({ type: 'rotate', by: Math.PI / 8 })
      else if (e.key === '+' || e.key === '=') send({ type: 'zoom', factor: 0.82 })
      else if (e.key === '-' || e.key === '_') send({ type: 'zoom', factor: 1.22 })
      else if (e.key === 'r' || e.key === 'R') send({ type: 'reset' })
      else if (e.key === 'a' || e.key === 'A') setAutoRotate(!useViewerStore.getState().autoRotate)
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      else if (e.key === 'Tab') {
        // keep focus inside the dialog
        const focusables = rootRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])')
        if (!focusables?.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
        return
      } else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, send, setAutoRotate, toggleFullscreen])

  if (!open) return null
  // rendered only after a click, so the DOM is available (iPhone Safari has no element fullscreen: button hidden)
  const fsRoot = document.documentElement as FsElement
  const fsSupported = !!(fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen)

  return (
    <div ref={rootRef} className="viewer" role="dialog" aria-modal="true" aria-labelledby="viewer-title">
      <header className="viewer-head">
        <div>
          <p className="viewer-kicker">360° VIEW · INTERACTIVE MODEL</p>
          <h2 className="viewer-title" id="viewer-title">
            INFINOS Pro Dual-Chamber Bag
          </h2>
        </div>
        <button ref={closeRef} type="button" className="viewer-close" onClick={closeProductViewer} aria-label="Close 360° view and return to the website">
          <span aria-hidden="true">✕</span> CLOSE
        </button>
      </header>

      <div className="viewer-stage">
        {webgl ? (
          <ViewerCanvas />
        ) : (
          <div className="viewer-fallback">
            <img src="/images/hero-fallback.jpg" alt="INFINOS Pro Dual-Chamber Bag" width={450} height={562} />
            <p>The interactive 360° view needs WebGL, which this browser has disabled.</p>
          </div>
        )}
        {webgl && (
          <p className="viewer-hint" aria-hidden="true">
            DRAG TO ROTATE · PINCH OR SCROLL TO ZOOM
          </p>
        )}
      </div>

      {webgl && (
        <div className="viewer-controls" role="toolbar" aria-label="360° view controls">
          <div className="viewer-group" role="group" aria-label="Rotate">
            <button type="button" className="viewer-btn" onClick={() => send({ type: 'rotate', by: -Math.PI / 4 })} aria-label="Rotate left 45 degrees">
              ◀
            </button>
            <span className="viewer-heading" aria-live="polite" aria-label={`Heading ${heading} degrees`}>
              {String(heading).padStart(3, '0')}°
            </span>
            <button type="button" className="viewer-btn" onClick={() => send({ type: 'rotate', by: Math.PI / 4 })} aria-label="Rotate right 45 degrees">
              ▶
            </button>
          </div>
          <div className="viewer-group" role="group" aria-label="Zoom">
            <button type="button" className="viewer-btn" onClick={() => send({ type: 'zoom', factor: 1.22 })} aria-label="Zoom out">
              −
            </button>
            <button type="button" className="viewer-btn" onClick={() => send({ type: 'zoom', factor: 0.82 })} aria-label="Zoom in">
              +
            </button>
          </div>
          <div className="viewer-group viewer-views" role="group" aria-label="Views">
            {VIEW_BUTTONS.map((v) => (
              <button key={v.view} type="button" className="viewer-btn viewer-btn--text" onClick={() => send({ type: 'view', view: v.view })}>
                {v.label}
              </button>
            ))}
          </div>
          <div className="viewer-group" role="group" aria-label="View options">
            <button type="button" className="viewer-btn viewer-btn--text" onClick={() => send({ type: 'reset' })}>
              RESET
            </button>
            <button
              type="button"
              className={`viewer-btn viewer-btn--text ${autoRotate ? 'viewer-btn--on' : ''}`}
              aria-pressed={autoRotate}
              onClick={() => setAutoRotate(!autoRotate)}
            >
              AUTO-ROTATE {autoRotate ? 'ON' : 'OFF'}
            </button>
            {fsSupported && (
              <button type="button" className="viewer-btn viewer-btn--text" aria-pressed={fullscreen} onClick={toggleFullscreen}>
                {fullscreen ? 'EXIT FULL SCREEN' : 'FULL SCREEN'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
