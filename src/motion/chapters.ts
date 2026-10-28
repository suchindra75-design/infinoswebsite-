import { useExperienceStore } from '@/state/experienceStore'
import {
  CLOSED,
  FULLY_OPEN,
  SEQUENCES,
  sequenceStages,
  smoothstep,
  type SequenceId,
  type StageAmounts,
} from '@/motion/sequences'

/** Product-stage phases, in scroll order (the camera track in cameraTrack.ts has one segment per phase). */
export type Phase = 'intro' | 'reveal' | 'hero' | 'detail' | 'open' | 'interior' | 'display' | 'overview'

export interface Chapter {
  id: string
  phase: Phase
  start: number
  end: number
  /** photoreal image sequence scrubbed by this chapter (the live scene follows the same camera + pose underneath) */
  sequence?: SequenceId
  /** show the sequence's first frame instead of scrubbing it (intro: the reveal waits on frame 0) */
  hold?: boolean
}

/**
 * The global story timeline: fractions of the narrative scroll region (0–1). One ScrollTrigger drives it; the
 * product stage (camera, poses, frames) and the editorial column (STORY_RANGES) are both pure functions of it.
 */
export const CHAPTERS: Chapter[] = [
  { id: 'intro', phase: 'intro', start: 0.0, end: 0.01, sequence: 'reveal', hold: true },
  { id: 'reveal', phase: 'reveal', start: 0.01, end: 0.11, sequence: 'reveal' },
  { id: 'hero', phase: 'hero', start: 0.11, end: 0.19 },
  { id: 'detail', phase: 'detail', start: 0.19, end: 0.31 },
  { id: 'open', phase: 'open', start: 0.31, end: 0.57, sequence: 'open' },
  { id: 'interior', phase: 'interior', start: 0.57, end: 0.69 },
  { id: 'display', phase: 'display', start: 0.69, end: 0.83 },
  { id: 'overview', phase: 'overview', start: 0.83, end: 1.0 },
]

/** Editorial chapters (right column), on the same global progress; each maps to the product pose noted. */
export interface StoryRange {
  id: string
  start: number
  end: number
}

const openAt = (t: number) => 0.31 + (0.57 - 0.31) * t
// open-sequence stage timing (sequences.json): flap/lid 0.02–0.36, drop 0.32–0.55, boxOut 0.55–0.8, boxLid 0.8–0.97
export const STORY_RANGES: StoryRange[] = [
  { id: 'overview', start: 0.0, end: 0.19 }, // reveal (product glides from the centre into its composition) + hero
  { id: 'architecture', start: 0.19, end: 0.31 }, // exterior pass and side view: the two stacked chambers / zones
  { id: 'cooling', start: 0.31, end: openAt(0.32) }, // flap and padded inner lid lift: the upper chamber (Zone 1)
  { id: 'compartments', start: openAt(0.32), end: openAt(0.8) }, // front panel drops, the inner box slides out
  { id: 'monitoring', start: openAt(0.8), end: 0.62 }, // the box lid opens: lining and sample rack
  { id: 'sustainability', start: 0.62, end: 0.71 }, // top-down interior, the bag begins to close
  { id: 'safety', start: 0.71, end: 0.83 }, // side display close-up
  { id: 'system', start: 0.83, end: 1.0 }, // exploded overview, final message
]

export const EXPLODED_HOLD = 0.55
/** the display chapter closes the bag (opening stages played backwards) during its first part */
export const DISPLAY_CLOSE = 0.45
/** image-sequence cross-fade width at chapter edges (fraction of the chapter) */
export const SEQUENCE_FADE = 0.07

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/** Complete overview: the closed bag separates into its layers (labelled), then holds. */
export function computeExplodedAmount(phase: Phase, chapterProgress: number): number {
  if (phase === 'overview') return easeInOut(Math.min(1, chapterProgress / EXPLODED_HOLD))
  return 0
}

/** Opening stages per phase: closed -> scrubbed open (photoreal sequence) -> open interior -> closing -> closed. */
export function computeStages(phase: Phase, chapterProgress: number): StageAmounts {
  if (phase === 'open') return sequenceStages(SEQUENCES.open, chapterProgress)
  if (phase === 'interior') return FULLY_OPEN
  if (phase === 'display') return sequenceStages(SEQUENCES.open, 1 - smoothstep(0, DISPLAY_CLOSE, chapterProgress))
  return CLOSED
}

/** Opacity of the image-sequence layer: the reveal starts covered; both sequences hand over to live 3D at their ends. */
export function computeSequenceCover(chapter: Chapter, chapterProgress: number): number {
  if (!chapter.sequence) return 0
  if (chapter.hold) return 1
  const fadeIn = chapter.phase === 'reveal' ? 1 : smoothstep(0, SEQUENCE_FADE, chapterProgress)
  return fadeIn * (1 - smoothstep(1 - SEQUENCE_FADE, 1, chapterProgress))
}

function sameStages(a: StageAmounts, b: StageAmounts) {
  return (Object.keys(a) as (keyof StageAmounts)[]).every((k) => Math.abs(a[k] - b[k]) < 0.0005)
}

export function chapterAt(progress: number): Chapter {
  return CHAPTERS.find((c) => progress >= c.start && progress < c.end) ?? CHAPTERS[CHAPTERS.length - 1]
}

export function applyScrollProgress(progress: number): void {
  const clamped = Math.min(1, Math.max(0, progress))
  const chapter = chapterAt(clamped)
  const chapterProgress = Math.min(1, Math.max(0, (clamped - chapter.start) / (chapter.end - chapter.start)))
  const explodedAmount = computeExplodedAmount(chapter.phase, chapterProgress)
  const stages = computeStages(chapter.phase, chapterProgress)
  const sequenceCover = computeSequenceCover(chapter, chapterProgress)

  const state = useExperienceStore.getState()
  const phaseChanged = state.phase !== chapter.phase
  const patch: Partial<typeof state> = {}

  if (state.progress !== clamped) patch.progress = clamped
  if (state.chapterProgress !== chapterProgress) patch.chapterProgress = chapterProgress
  if (Math.abs(state.explodedAmount - explodedAmount) > 0.001) patch.explodedAmount = explodedAmount
  if (!sameStages(state.stages, stages)) patch.stages = stages
  if (Math.abs(state.sequenceCover - sequenceCover) > 0.001 || (sequenceCover === 0) !== (state.sequenceCover === 0))
    patch.sequenceCover = sequenceCover
  if (state.sequenceId !== (chapter.sequence ?? null)) patch.sequenceId = chapter.sequence ?? null
  if (phaseChanged) {
    patch.phase = chapter.phase
    // leaving the interactive hero: the drag yaw is already weighted to zero at the boundary, so clearing it is seamless
    if (chapter.phase !== 'hero') {
      patch.hotspot = null
      patch.yaw = 0
    }
  }

  if (Object.keys(patch).length > 0) useExperienceStore.setState(patch)
}

export { smoothstep }
