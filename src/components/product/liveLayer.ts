import type { ExperienceState } from '@/state/experienceStore'
import { stageCover } from '@/motion/stageCover'

/**
 * Whether the live 3D layer is (or is about to be) on screen: not fully covered by a decoded photoreal frame, or from
 * 85 % into a sequence chapter so it already shows the current pose when the frames hand over. Evaluated inside the
 * shared frame loop every tick (after the frame canvas has decided what it can show), so the 3D layer renders the
 * current pose in the same frame it becomes visible — never a stale image from an earlier pose.
 */
export function liveLayerActive(s: ExperienceState): boolean {
  // the 360° viewer, or the coolant showcase fully covering the stage (motion/stageCover.ts)
  if (s.viewerOpen || stageCover.covered) return false
  const ready = s.sequenceId ? !!s.sequenceReady[s.sequenceId] && s.sequenceFrameOk : false
  const covered = s.sequenceId && ready ? s.sequenceCover : 0
  const handoverSoon = !!s.sequenceId && s.chapterProgress > 0.85
  return covered < 0.999 || handoverSoon
}
