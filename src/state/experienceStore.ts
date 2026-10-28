import { create } from 'zustand'
import type { Phase } from '@/motion/chapters'
import { CLOSED, type StageAmounts } from '@/motion/sequences'

export type HotspotId = 'flap' | 'display' | 'dropPanel' | 'biohazard'

/**
 * Timed opening (IntroSequence): loading (0–2 s, product hidden) -> logo (2–4 s) -> outro (logo leaves) -> product
 * (bag fades in, already sharp) -> ready (scroll story enabled;
 * the product then moves into the left stage as the visitor scrolls).
 */
export type IntroPhase = 'loading' | 'logo' | 'outro' | 'product' | 'ready'

export interface ExperienceState {
  phase: Phase
  progress: number
  chapterProgress: number
  explodedAmount: number
  /** opening-stage amounts (flap, lid, drop, boxOut, boxLid), scrubbed by scroll */
  stages: StageAmounts
  /** 0..1 opacity of the photoreal image-sequence layer over the live 3D scene */
  sequenceCover: number
  /** id of the image sequence driving the current chapter, if any */
  sequenceId: string | null
  /** whether a sequence has frames available (false -> the live 3D path is shown instead) */
  sequenceReady: Record<string, boolean>
  /** whether the frame for the current scroll position (or a close neighbour) is loaded */
  sequenceFrameOk: boolean
  /** opening: share of the reveal frames preloaded (0..1) */
  openingProgress: number
  /** opening: reveal frames are ready — the product may light up */
  openingReady: boolean
  /** opening state machine */
  introPhase: IntroPhase
  yaw: number
  /** the dedicated 360° viewer overlay is open (the narrative is paused underneath) */
  viewerOpen: boolean
  /** product yaw requested by the explore hotspots (the drag rig eases toward it) */
  hotspot: HotspotId | null
  modelFailed: boolean
  modelReady: boolean
  pointer: { x: number; y: number }
  webglSupported: boolean
  reducedMotion: boolean
  isMobile: boolean
  menuOpen: boolean
  setPointer: (x: number, y: number) => void
  setMenuOpen: (open: boolean) => void
  setHotspot: (id: HotspotId | null) => void
  setViewerOpen: (open: boolean) => void
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  phase: 'intro',
  progress: 0,
  chapterProgress: 0,
  explodedAmount: 0,
  stages: CLOSED,
  sequenceCover: 0,
  sequenceId: null,
  sequenceReady: {},
  sequenceFrameOk: false,
  openingProgress: 0,
  openingReady: false,
  introPhase: 'loading',

  yaw: 0,
  viewerOpen: false,
  hotspot: null,
  modelFailed: false,
  modelReady: false,
  pointer: { x: 0, y: 0 },
  webglSupported: true,
  reducedMotion: false,
  isMobile: false,
  menuOpen: false,
  setPointer: (x, y) => set({ pointer: { x, y } }),
  setMenuOpen: (open) => set({ menuOpen: open }),
  setHotspot: (id) => set({ hotspot: id }),
  setViewerOpen: (open) => set({ viewerOpen: open }),
}))
