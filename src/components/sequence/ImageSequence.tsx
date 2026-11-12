'use client'

import { useEffect, useRef } from 'react'
import { useExperienceStore } from '@/state/experienceStore'
import { chapterAt } from '@/motion/chapters'
import { cameraAt } from '@/motion/cameraTrack'
import { compositionAt, layoutMode, maxScale, type Composition } from '@/motion/composition'
import { addRenderer, requestFrame } from '@/motion/frameLoop'
import { SEQUENCES, filmLayout, sequenceFrame, sequenceGain, sequenceLastCamera, type CameraPose, type SequenceDef, type SequenceId } from '@/motion/sequences'
import { extendFilmEdges } from './filmEdges'
import { PHONE_QUERY } from '@/motion/phoneLayout'
import { stageSize } from '@/hooks/environment'

type Variant = 'desktop' | 'mobile'

/**
 * The live 3D layer's wrapper. Both layer opacities are written together in the frame loop, so the photoreal frame and
 * the live model always sum to a fully covered stage — no blank or double-exposed frame between them.
 */
export const liveLayerRef: { current: HTMLDivElement | null } = { current: null }

/**
 * Stable mount point for drei <Html> labels on the live model (the live layer itself, so they cross-fade with it).
 * Without it, Html re-targets from the canvas parent to R3F's event element once events connect, unmounting its own
 * React root during a render.
 */
export const htmlPortal = liveLayerRef as unknown as React.RefObject<HTMLElement>

/** the held opening frame's cross-fade to the live model once it is ready (ms) */
const HOLD_FADE_MS = 450

/** a decoded neighbour within this many frames may stand in for the exact frame while it is being decoded */
const MAX_FRAME_DISTANCE = 4

interface Decoded {
  source: CanvasImageSource
  close: () => void
}

/**
 * Decode a compressed frame OFF the main thread. Drawing an <img> into a canvas makes Chrome decode the 2560 px WebP
 * synchronously inside the frame commit (~70 ms per new frame — the cause of the old scroll stutter); createImageBitmap
 * decodes on a worker thread. Frames are decoded at their native size on purpose: resize options make Chrome scale the
 * bitmap on the main thread (~50 ms per frame on phones), so each screen loads the frame set closest to its needs.
 */
async function decodeFrame(blob: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(blob)
      return { source: bmp, close: () => bmp.close() }
    } catch {
      // fall through (engines without Blob support in createImageBitmap)
    }
  }
  const url = URL.createObjectURL(blob)
  const img = new Image()
  img.src = url
  await img.decode()
  return { source: img, close: () => URL.revokeObjectURL(url) }
}

/**
 * One photoreal sequence: compressed frames are fetched once and kept (about 90 KB each); a bounded window of decoded
 * bitmaps follows the scroll position (ahead in the scroll direction first) and is evicted farthest-first, so memory
 * stays within a fixed budget however long the visitor scrolls.
 */
class FrameSet {
  readonly blobs: (Blob | null)[]
  readonly bitmaps = new Map<number, Decoded>()
  fetched = 0
  failed = false
  disposed = false
  private started = false
  private queue: number[] = []
  private inflight = 0
  private decoding = new Set<number>()
  private target = 0
  private dir = 1

  constructor(
    readonly id: SequenceId,
    readonly def: SequenceDef,
    readonly variant: Variant,
    private readonly order: 'sequential' | 'progressive',
    private readonly maxBitmaps: number,
    private readonly concurrency: number,
    private readonly onFetched: (set: FrameSet, index: number) => void,
    private readonly onDecoded: (set: FrameSet, index: number) => void,
  ) {
    this.blobs = new Array(def.frames).fill(null)
  }

  url(i: number) {
    return `${this.def.dir}/${this.variant}/${String(i).padStart(4, '0')}.webp`
  }

  start() {
    if (this.started) return
    this.started = true
    const n = this.def.frames
    const seen = new Set<number>()
    const push = (i: number) => {
      if (i >= 0 && i < n && !seen.has(i)) {
        seen.add(i)
        this.queue.push(i)
      }
    }
    if (this.order === 'sequential') {
      for (let i = 0; i < n; i++) push(i)
    } else {
      push(0)
      push(n - 1)
      for (const stride of [16, 8, 4, 2, 1]) for (let i = 0; i < n; i += stride) push(i)
    }
    this.pumpFetch()
  }

  private pumpFetch() {
    while (!this.disposed && !this.failed && this.inflight < 6 && this.queue.length) {
      const i = this.queue.shift() as number
      this.inflight++
      fetch(this.url(i))
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
        .then((blob) => {
          this.inflight--
          if (this.disposed) return
          this.blobs[i] = blob
          this.fetched++
          this.onFetched(this, i)
          this.pumpDecode()
          this.pumpFetch()
        })
        .catch(() => {
          this.inflight--
          if (this.disposed) return
          if (i === 0) this.failed = true // no frames deployed: the live 3D path covers this chapter
          this.pumpFetch()
        })
    }
  }

  /** the frame the visitor is looking at; decoding follows it */
  want(i: number) {
    if (i !== this.target) this.dir = i > this.target ? 1 : -1
    this.target = i
    if (!this.blobs[i] && this.queue.includes(i)) {
      // visitor jumped ahead of the download: fetch the neighbourhood first
      const near = this.queue.filter((q) => Math.abs(q - i) <= 6).sort((a, b) => Math.abs(a - i) - Math.abs(b - i))
      const set = new Set(near)
      this.queue = [...near, ...this.queue.filter((q) => !set.has(q))]
      this.start()
      this.pumpFetch()
    }
    this.pumpDecode()
  }

  /** decode order around the target: ahead in the scroll direction first, a little behind for reversals */
  private priorities(): number[] {
    const out: number[] = [this.target]
    const ahead = Math.max(2, Math.ceil(this.maxBitmaps * 0.65))
    const behind = Math.max(1, this.maxBitmaps - 1 - ahead)
    for (let k = 1; k <= ahead; k++) {
      out.push(this.target + this.dir * k)
      if (k <= behind) out.push(this.target - this.dir * k)
    }
    return out.filter((i) => i >= 0 && i < this.def.frames)
  }

  private pumpDecode() {
    if (this.disposed) return
    for (const i of this.priorities()) {
      if (this.decoding.size >= this.concurrency) break
      if (this.bitmaps.has(i) || this.decoding.has(i)) continue
      const blob = this.blobs[i]
      if (!blob) continue
      this.decoding.add(i)
      decodeFrame(blob)
        .then((d) => {
          this.decoding.delete(i)
          if (this.disposed) return d.close()
          this.bitmaps.set(i, d)
          this.evict()
          this.onDecoded(this, i)
          this.pumpDecode()
        })
        .catch(() => {
          this.decoding.delete(i)
          this.pumpDecode()
        })
    }
  }

  private evict() {
    if (this.bitmaps.size <= this.maxBitmaps) return
    const far = [...this.bitmaps.keys()].sort((a, b) => Math.abs(b - this.target) - Math.abs(a - this.target))
    for (const i of far) {
      if (this.bitmaps.size <= this.maxBitmaps) break
      // frame 0 stays: it is the page's resting frame (First Light, and the top of the story)
      if (Math.abs(i - this.target) <= 1 || i === 0) continue
      this.bitmaps.get(i)?.close()
      this.bitmaps.delete(i)
    }
  }

  /** nearest decoded frame to i and its distance in frames */
  nearest(i: number): { frame: Decoded; index: number; distance: number } | null {
    for (let d = 0; d <= MAX_FRAME_DISTANCE; d++) {
      const a = this.bitmaps.get(i - d)
      if (a) return { frame: a, index: i - d, distance: d }
      const b = this.bitmaps.get(i + d)
      if (b) return { frame: b, index: i + d, distance: d }
    }
    return null
  }

  /** the decoded frame closest to i, at any distance */
  closest(i: number): { frame: Decoded; index: number; distance: number } | null {
    let best: { frame: Decoded; index: number; distance: number } | null = null
    for (const [index, frame] of this.bitmaps) {
      const distance = Math.abs(index - i)
      if (!best || distance < best.distance) best = { frame, index, distance }
    }
    return best
  }

  dispose() {
    this.disposed = true
    for (const d of this.bitmaps.values()) d.close()
    this.bitmaps.clear()
  }
}

/**
 * Photoreal image-sequence layer. Frames are rendered offline in Blender Cycles from the same model, camera path and
 * opening stages as the live scene (src/content/sequences.json, tools/render_sequences.py), drawn with the same film
 * layout as the live camera, and cross-faded with the interactive 3D at chapter boundaries. Drawn from the shared
 * frame loop, in the same frame as the scroll update.
 */
export function ImageSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = window.innerWidth
    const H = window.innerHeight
    const small = Math.min(W, H) < 700
    // the largest the film is ever drawn on this screen (composition.ts maxScale) decides the frame set
    const neededW = filmLayout(W, H, undefined, { x: 0.5, y: 0.5, s: maxScale(layoutMode(W, H)) }).w * dpr
    const variantFor = (def: SequenceDef): Variant => (neededW > (def.render?.mobileWidth ?? 960) * 1.05 ? 'desktop' : 'mobile')
    // decoded-bitmap memory budget (RGBA): ~190 MB on desktop, ~70 MB on phones
    const budget = (small ? 70 : 190) * 1024 * 1024

    const sets = {} as Record<SequenceId, FrameSet>
    const markOpeningReady = () => {
      if (!useExperienceStore.getState().openingReady) useExperienceStore.setState({ openingReady: true })
    }
    // Touch screens load the opening frames spread across the whole reveal first (every 16th, 8th, then 4th frame):
    // once those have arrived every moment of the reveal has a frame within two of it (FrameSet.nearest), so the story
    // can open without waiting for all 72 (about 3.5 MB on a phone); the rest fill in behind. Desktop keeps the
    // complete sequential preload.
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    const phoneLayout = window.matchMedia(PHONE_QUERY)
    const openingNeeds = (def: SequenceDef) => (touch ? Math.ceil(def.frames / 4) + 2 : def.frames)
    const onFetched = (set: FrameSet) => {
      if (set.id === 'reveal') {
        const progress = Math.min(1, set.fetched / openingNeeds(set.def))
        useExperienceStore.setState({ openingProgress: progress })
        if (progress >= 1 && set.bitmaps.has(0)) markOpeningReady()
        if (set.fetched >= set.def.frames && !phoneLayout.matches) sets.open.start()
      }
    }
    const onDecoded = (set: FrameSet, index: number) => {
      if (index === 0 && !useExperienceStore.getState().sequenceReady[set.id]) {
        const ready = useExperienceStore.getState().sequenceReady
        useExperienceStore.setState({ sequenceReady: { ...ready, [set.id]: true } })
        if (set.id === 'reveal' && set.fetched >= openingNeeds(set.def)) markOpeningReady()
      }
      requestFrame()
    }
    for (const id of Object.keys(SEQUENCES) as SequenceId[]) {
      const def = SEQUENCES[id]
      const variant = variantFor(def)
      const w = variant === 'desktop' ? def.render?.width ?? 2560 : def.render?.mobileWidth ?? 1600
      const h = variant === 'desktop' ? def.render?.height ?? 1600 : def.render?.mobileHeight ?? 1000
      const maxBitmaps = Math.max(6, Math.min(40, Math.floor(budget / (w * h * 4))))
      sets[id] = new FrameSet(id, def, variant, id === 'reveal' && !touch ? 'sequential' : 'progressive', maxBitmaps, small ? 2 : 3, onFetched, onDecoded)
    }

    // Safety nets: after 9 s continue once frame 0 is decoded (the frame-accuracy guard keeps the exact live model
    // visible for any frame not yet decoded); if no frames are deployed, continue immediately.
    const openingTimeout = window.setTimeout(() => {
      if (sets.reveal.bitmaps.has(0)) markOpeningReady()
    }, 9000)
    const failCheck = window.setInterval(() => {
      if (sets.reveal.failed) markOpeningReady()
      if (useExperienceStore.getState().openingReady) window.clearInterval(failCheck)
    }, 250)

    let lastKey = ''
    // whether the last tick showed a frame (see the fallback in draw)
    let showing = false
    const comp: Composition = { x: 0.5, y: 0.5, s: 1 }
    const setLayers = (seq: number) => {
      const o = String(seq)
      if (canvas.style.opacity !== o) canvas.style.opacity = o
      const live = liveLayerRef.current
      const lo = String(1 - seq)
      if (live && live.style.opacity !== lo) live.style.opacity = lo
    }
    const setFrameOk = (ok: boolean) => {
      if (useExperienceStore.getState().sequenceFrameOk !== ok) useExperienceStore.setState({ sequenceFrameOk: ok })
    }

    // The reveal's hand-over frame, held while the live model is still on its way (see draw)
    let hold = 0
    let holdFrom = 0
    let pendingBefore = false
    const setHeld = (held: boolean) => {
      if (useExperienceStore.getState().stageHeld !== held) useExperienceStore.setState({ stageHeld: held })
    }

    const paint = (set: FrameSet, found: { frame: Decoded; index: number }, pose: CameraPose, progress: number, w: number, h: number, cw: number, ch: number) => {
      const key = `${set.id}:${found.index}:${w}x${h}:${progress.toFixed(5)}`
      if (key === lastKey) return
      lastKey = key
      // same framing as the live camera: pose subject placed by the editorial composition
      const l = filmLayout(cw, ch, pose, compositionAt(progress, layoutMode(cw, ch), comp, cw, ch))
      // whole device pixels: the shadow continued past the film edge (filmEdges.ts) then meets the frame without a
      // half-covered row between them (a sub-pixel shift, invisible, and well inside the live layer's alignment)
      const x = Math.round(-l.ox * dpr)
      const y = Math.round(-l.oy * dpr)
      const fw = Math.round((l.w - l.ox) * dpr) - x
      const fh = Math.round((l.h - l.oy) * dpr) - y
      ctx.clearRect(0, 0, w, h)
      // frames are decoded at (about) the drawn size, so plain GPU bilinear filtering is visually identical to
      // 'high' — which costs a slow resampling pass on every draw and dropped frames while scrubbing
      ctx.imageSmoothingQuality = 'low'
      ctx.drawImage(found.frame.source, x, y, fw, fh)
      // on the lit studio floor the frame's shadow must not end at the film edge (filmEdges.ts)
      extendFilmEdges(ctx, found.frame.source, set.id, found.index, x, y, fw, fh)
      // exposure match for the first open frames (sequences.json displayGainKeys): darken the drawn pixels only,
      // inside the canvas — a CSS filter on this full-screen layer would cost a GPU filter pass every frame
      const gain = sequenceGain(set.def, found.index / Math.max(1, set.def.frames - 1))
      if (gain < 0.999) {
        ctx.globalCompositeOperation = 'source-atop'
        ctx.fillStyle = `rgba(0,0,0,${(1 - gain).toFixed(3)})`
        ctx.fillRect(x, y, fw, fh)
        ctx.globalCompositeOperation = 'source-over'
      }
    }

    const draw = (now: number) => {
      // the canvas fills the stage: its size comes from the stage's ResizeObserver (hooks/environment.ts). Reading
      // clientWidth here, after the text and studio layers had written their styles in this same frame, forced a full
      // style recalculation every frame (traced: ~2.5 ms a frame on a phone at 4x CPU throttle)
      const { W: cw, H: ch } = stageSize()
      const w = Math.round(cw * dpr)
      const h = Math.round(ch * dpr)
      if (w !== canvas.width || h !== canvas.height) {
        canvas.width = w
        canvas.height = h
        lastKey = ''
      }
      const st = useExperienceStore.getState()
      const { progress, sequenceId, sequenceCover } = st
      const set = sequenceId ? sets[sequenceId as SequenceId] : undefined
      // phones play the open chapters on the live model (chapters.ts framesFor): their frames load only if the
      // screen turns to a layout that shows them
      if (progress > 0.12 && !phoneLayout.matches) sets.open.start()

      // Waiting for the live model. On a phone connection it arrives seconds after the intro (measured: ~5 s at 12
      // Mbps, ~8 s at 5 Mbps), and a visitor who swiped straight on found an empty floor under the hero's text. Until
      // it has drawn, the reveal's hand-over frame stays on the stage — the same bag, placed where the live one will
      // stand — and then cross-fades to it.
      const pending = st.webglSupported && !st.modelFailed && !st.modelReady && st.introPhase === 'ready'
      if (pending) hold = 1
      else if (hold > 0) {
        if (pendingBefore) holdFrom = now
        hold = Math.max(0, 1 - (now - holdFrom) / HOLD_FADE_MS)
      }
      pendingBefore = pending
      const reveal = sets.reveal
      const framesHere = !!set && !set.failed && sequenceCover > 0.001

      if (!framesHere) {
        showing = false
        // the hand-over frame or a near neighbour (not, say, the pinned first frame: it is posed elsewhere)
        const last = reveal.def.frames - 1
        const near = hold > 0 && !reveal.failed ? reveal.closest(last) : null
        const held = near && near.distance <= MAX_FRAME_DISTANCE * 2 ? near : null
        setHeld(!!held && pending)
        if (hold > 0) reveal.want(last)
        if (!held) {
          setLayers(0)
          return
        }
        setLayers(hold)
        paint(reveal, held, sequenceLastCamera('reveal'), progress, w, h, cw, ch)
        // still fading: one more frame
        return hold > 0 && !pending
      }
      setHeld(false)

      const chapter = chapterAt(progress)
      const cp = Math.min(1, Math.max(0, (progress - chapter.start) / (chapter.end - chapter.start)))
      const index = sequenceFrame(set.def, chapter.hold ? 0 : cp)
      set.want(index)
      // Cover the live model only with a frame that shows (nearly) the right moment; otherwise the live scene, which is
      // always exact, stays visible until the right frame is decoded. Once frames are on screen, though, they stay: a
      // farther decoded frame stands in for the few ms until the right one arrives. Dropping to the live model for those
      // ms swapped the photo for a differently lit render and back — a visible flicker on phones, which decode slowly
      // and keep few frames (owner's device video, 2026-11-11).
      const found = set.nearest(index) ?? (showing ? set.closest(index) : null)
      showing = !!found
      setFrameOk(!!found)
      // the reveal's own hand-over to the live model waits for the model as well (the held frame above continues it)
      setLayers(found ? Math.max(sequenceCover, sequenceId === 'reveal' ? hold : 0) : 0)
      if (!found) return
      paint(set, found, cameraAt(chapter.phase, cp), progress, w, h, cw, ch)
      return hold > 0 && !pending
    }

    const unregister = addRenderer(draw, 20)
    sets.reveal.start()

    return () => {
      for (const set of Object.values(sets)) set.dispose()
      window.clearTimeout(openingTimeout)
      window.clearInterval(failCheck)
      unregister()
    }
  }, [])

  return <canvas ref={canvasRef} className="sequence-canvas" aria-hidden="true" />
}
