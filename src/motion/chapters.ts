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

function sameStages(a: StageAmounts, b: StageAmounts, tol: number) {
  return (Object.keys(a) as (keyof StageAmounts)[]).every((k) => (tol ? Math.abs(a[k] - b[k]) < tol : a[k] === b[k]))
}

/**
 * The photoreal sequence a chapter shows on this layout. Phones play the opening chapters (03–05) on the live model:
 * the open sequence's frames are composed for a wide screen — 81 of its 120 frames crop the raised lid at the top of
 * the film and its first frames are a tight close-up of the front emblem — so on a tall screen they could only show
 * fragments of the bag. The live scene follows the identical camera path and opening stages, renders the whole bag
 * at any framing (composition.ts phone track), and the phone never downloads or decodes those 120 frames.
 *
 * `liveReveal`: phones open the story on the photoreal reveal frames (First Light and the first scroll), which hand
 * over to the live model at the hero. Scrolling back up then played the frames again — but a phone keeps only ~10
 * decoded frames, so the frame for a quick return was often still decoding and the stage swapped between the photo and
 * the live model (lit differently, a few pixels apart) several times a second: the owner's device video, 2026-11-11.
 * After that first handover the live model, which follows the identical camera path, plays the reveal both ways.
 */
export function framesFor(chapter: Chapter, phone: boolean, liveReveal = false): SequenceId | undefined {
  if (phone && chapter.sequence === 'open') return undefined
  if (phone && liveReveal && chapter.sequence === 'reveal') return undefined
  return chapter.sequence
}

/** where the reveal frames have handed over to the live model (the hero chapter, which has no frames) */
const REVEAL_END = CHAPTERS.find((c) => c.id === 'reveal')!.end

export function chapterAt(progress: number): Chapter {
  return CHAPTERS.find((c) => progress >= c.start && progress < c.end) ?? CHAPTERS[CHAPTERS.length - 1]
}

/**
 * `exact`: write every value that differs at all. In motion, changes below a small tolerance are skipped (no redraw for
 * an invisible change); an eased approach (touch screens, ScrollChapterController) would then come to rest up to that
 * tolerance short of the exact pose, so the settled position is written exactly.
 */
export function applyScrollProgress(progress: number, exact = false): void {
  const clamped = Math.min(1, Math.max(0, progress))
  const chapter = chapterAt(clamped)
  const chapterProgress = Math.min(1, Math.max(0, (clamped - chapter.start) / (chapter.end - chapter.start)))
  const explodedAmount = computeExplodedAmount(chapter.phase, chapterProgress)
  const stages = computeStages(chapter.phase, chapterProgress)
  const state = useExperienceStore.getState()
  const patch: Partial<typeof state> = {}
  // the hero is on screen with the live model in it: from here on, phones play the reveal live (framesFor)
  const liveReveal = state.liveReveal || (state.phone && state.modelReady && clamped >= REVEAL_END)
  if (liveReveal !== state.liveReveal) patch.liveReveal = liveReveal
  const sequence = framesFor(chapter, state.phone, liveReveal)
  const sequenceCover = sequence ? computeSequenceCover(chapter, chapterProgress) : 0

  const phaseChanged = state.phase !== chapter.phase

  if (state.progress !== clamped) patch.progress = clamped
  if (state.chapterProgress !== chapterProgress) patch.chapterProgress = chapterProgress
  const tol = exact ? 0 : 0.001
  if (Math.abs(state.explodedAmount - explodedAmount) > tol) patch.explodedAmount = explodedAmount
  if (!sameStages(state.stages, stages, exact ? 0 : 0.0005)) patch.stages = stages
  if (Math.abs(state.sequenceCover - sequenceCover) > tol || (sequenceCover === 0) !== (state.sequenceCover === 0))
    patch.sequenceCover = sequenceCover
  if (state.sequenceId !== (sequence ?? null)) patch.sequenceId = sequence ?? null
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
