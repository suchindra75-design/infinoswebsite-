import type { Phase } from '@/motion/chapters'
import {
  SEQUENCES,
  sequenceCamera,
  sequenceFirstCamera,
  sequenceLastCamera,
  smoothstep,
  type CameraKey,
  type CameraPose,
  type SequenceDef,
  type Vec3,
} from '@/motion/sequences'

/**
 * ONE continuous, scroll-scrubbed camera track for the whole story.
 *
 * Every chapter owns a segment evaluated with the same Catmull-Rom + sine-ease maths as the rendered sequences:
 *  - sequence chapters (reveal, open) use the exact path the Cycles frames were rendered with;
 *  - live chapters are key paths whose FIRST key equals the previous chapter's last pose and whose LAST key equals the
 *    next chapter's first pose (camera AND stage subject).
 * Position, target, fov and the stage framing are therefore continuous everywhere, velocity is zero at every chapter
 * boundary, and the camera is a pure function of scroll progress: scrolling back up retraces exactly the same frames.
 */

const BAG: Vec3 = [0, 0.9, 0]
const k = (t: number, p: CameraPose, subject?: Vec3): CameraKey => ({ t, pos: p.pos, target: p.target, fov: p.fov, subject: subject ?? p.subject })
const pose = (pos: Vec3, target: Vec3, fov: number, subject?: Vec3): CameraPose => ({ pos, target, fov, subject: subject ?? target })

const REVEAL_START = sequenceFirstCamera('reveal')
const REVEAL_END = sequenceLastCamera('reveal')
const OPEN_START = sequenceFirstCamera('open')
const OPEN_END = sequenceLastCamera('open')

/** hero: a slow push-in from the reveal's last frame while the visitor explores (bag centred in the stage) */
const HERO_END = pose([-2.72, 1.47, 4.06], [-0.52, 0.92, 0.0], 35, BAG)
// editorial detail views: each feature is the focus, but the product stays legible as an object (composition.ts)
const DETAIL_FLAP = pose([-1.85, 2.85, 4.1], [0.0, 1.45, 0.3], 30, [0.0, 1.1, 0.25])
const DETAIL_DISPLAY = pose([4.3, 1.45, 2.2], [0.62, 0.8, 0.08], 31)
/** wide front-right pass between the flap and the side panel (keeps the camera clear of the bag) */
const DETAIL_PASS = pose([2.2, 2.3, 5.4], [0.2, 1.15, 0.2], 31)
/** inner box out and open: looking down onto the reflective liner and the perforated rack */
// subject between the box and the bag behind it, so the composition frames both (the box stays the focus)
const INTERIOR = pose([-1.3, 4.4, 4.7], [0.0, 0.45, 1.25], 32, [0.0, 1.0, 0.75])
const INTERIOR_RACK = pose([-0.55, 4.9, 3.6], [0.0, 0.35, 1.3], 30, [0.0, 0.9, 0.85])
const DISPLAY = pose([3.85, 1.42, 1.85], [0.62, 1.0, 0.05], 30)
const DISPLAY_END = pose([3.62, 1.38, 1.7], [0.62, 1.0, 0.05], 29)
// subject right of the stack: the exploded layers sit left of the stage centre, leaving room for the right-hand labels
const OVERVIEW = pose([0.6, 2.2, 10.8], [0.0, 1.5, 0.3], 28, [0.55, 1.5, 0.3])
const OVERVIEW_END = pose([2.1, 2.5, 10.3], [0.0, 1.45, 0.3], 28, [0.55, 1.45, 0.3])

const live = (keys: CameraKey[]): SequenceDef => ({ phase: 'live', frames: 0, dir: '', keys, stages: {} })

export const CAMERA_TRACK: Record<Phase, SequenceDef> = {
  intro: live([k(0, REVEAL_START), k(1, REVEAL_START)]),
  reveal: SEQUENCES.reveal,
  hero: live([k(0, REVEAL_END), k(1, HERO_END)]),
  // flap close-up -> display + emblem -> front emblem (= first frame of the open sequence), with short holds
  detail: live([
    k(0, HERO_END),
    k(0.24, DETAIL_FLAP),
    k(0.36, DETAIL_FLAP),
    k(0.49, DETAIL_PASS),
    k(0.62, DETAIL_DISPLAY),
    k(0.74, DETAIL_DISPLAY),
    k(1, OPEN_START),
  ]),
  open: SEQUENCES.open,
  interior: live([k(0, OPEN_END), k(0.45, INTERIOR), k(1, INTERIOR_RACK)]),
  display: live([k(0, INTERIOR_RACK), k(0.55, DISPLAY), k(1, DISPLAY_END)]),
  overview: live([k(0, DISPLAY_END), k(0.5, OVERVIEW), k(1, OVERVIEW_END)]),
}

export function cameraAt(phase: Phase, chapterProgress: number): CameraPose {
  return sequenceCamera(CAMERA_TRACK[phase], chapterProgress)
}

/**
 * Weight of the interactive layer (drag yaw, pointer parallax, idle drift) in the hero chapter. It ramps to zero at
 * both hero boundaries, so the hand-offs to the reveal frames and to the detail path are exact in both directions.
 */
export function heroInteractionWeight(phase: Phase, chapterProgress: number): number {
  if (phase !== 'hero') return 0
  return smoothstep(0, 0.12, chapterProgress) * (1 - smoothstep(0.88, 1, chapterProgress))
}
