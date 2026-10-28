import data from '@/content/sequences.json'
import type { OpenStage } from '@/content/products'
import type { Composition } from '@/motion/composition'

/**
 * Shared math for the hybrid experience. tools/render_sequences.py implements the SAME functions (ease, Catmull-Rom,
 * smoothstep stages) so a pre-rendered frame and the live 3D scene agree at every scroll position - which is what lets
 * the photoreal image sequences cross-fade into the interactive model without a visible jump.
 */

export type Vec3 = [number, number, number]
export type StageAmounts = Record<OpenStage, number>
export type SequenceId = keyof typeof data.sequences

export interface CameraKey {
  t: number
  pos: Vec3
  target: Vec3
  fov: number
  /**
   * World point the product stage keeps centred (defaults to `target`). The reveal and hero aim the camera beside the
   * bag; their subject is the bag itself, so the bag sits centred in the stage while frames and live model stay locked.
   */
  subject?: Vec3
}

export interface SequenceDef {
  phase: string
  frames: number
  dir: string
  keys: CameraKey[]
  stages: Partial<Record<OpenStage, [number, number]>>
  /**
   * Display-time brightness for the frames (CSS brightness on the frame canvas; the rendered files are untouched),
   * calibrated so the photoreal layer matches the live model's exposure at the hand-overs.
   */
  displayGain?: number
  /**
   * Optional gain curve [t, gain] along the sequence (linear). Path tracing and real-time shading differ by content
   * (Cycles lifts dark fabric with bounced light), so the gain is calibrated at both hand-over zones and returns to the
   * native render exposure in between, where the frames cover the stage on their own.
   */
  displayGainKeys?: [number, number][]
  /** per-sequence frame sizes / render settings (fall back to `film`) */
  render?: { width: number; height: number; mobileWidth: number; mobileHeight: number; samples?: number; exposureEV?: number }
}

export interface CameraPose {
  pos: Vec3
  target: Vec3
  fov: number
  subject: Vec3
}

export const FILM = data.film
export const SEQUENCES = data.sequences as unknown as Record<SequenceId, SequenceDef>

export const CLOSED: StageAmounts = { flap: 0, lid: 0, drop: 0, boxOut: 0, boxLid: 0 }
export const FULLY_OPEN: StageAmounts = { flap: 1, lid: 1, drop: 1, boxOut: 1, boxLid: 1 }
export const STAGE_ORDER: OpenStage[] = ['flap', 'lid', 'drop', 'boxOut', 'boxLid']

export function clamp01(t: number) {
  return Math.min(1, Math.max(0, t))
}

export function smoothstep(a: number, b: number, t: number) {
  const x = clamp01((t - a) / (b - a))
  return x * x * (3 - 2 * x)
}

/** Sine ease-in-out: the paths start and end at rest, so hand-offs to the live camera have no velocity jump. */
export function easeInOutSine(t: number) {
  return 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t))
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, s: number) {
  const s2 = s * s
  const s3 = s2 * s
  return 0.5 * (2 * p1 + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s2 + (-p0 + 3 * p1 - 3 * p2 + p3) * s3)
}

function splineAt(values: number[][], times: number[], u: number): number[] {
  const n = values.length
  let i = 0
  while (i < n - 2 && u > times[i + 1]) i++
  const s = clamp01((u - times[i]) / (times[i + 1] - times[i]))
  const p1 = values[i]
  const p2 = values[i + 1]
  const p0 = i > 0 ? values[i - 1] : p1.map((v, k) => 2 * v - p2[k])
  const p3 = i + 2 < n ? values[i + 2] : p2.map((v, k) => 2 * v - p1[k])
  return p1.map((_, k) => catmullRom(p0[k], p1[k], p2[k], p3[k], s))
}

/** Camera of a sequence at chapter progress t (0..1). */
export function sequenceCamera(seq: SequenceDef, t: number): CameraPose {
  const u = easeInOutSine(t)
  const times = seq.keys.map((k) => k.t)
  const pos = splineAt(seq.keys.map((k) => k.pos), times, u) as Vec3
  const target = splineAt(seq.keys.map((k) => k.target), times, u) as Vec3
  const [fov] = splineAt(seq.keys.map((k) => [k.fov]), times, u)
  const subject = splineAt(seq.keys.map((k) => k.subject ?? k.target), times, u) as Vec3
  return { pos, target, fov, subject }
}

/** Opening-stage amounts of a sequence at chapter progress t. Stages without a window keep `base`. */
export function sequenceStages(seq: SequenceDef, t: number, base: StageAmounts = CLOSED): StageAmounts {
  const out = { ...base }
  for (const stage of STAGE_ORDER) {
    const w = seq.stages[stage]
    if (w) out[stage] = smoothstep(w[0], w[1], t)
  }
  return out
}

export function sequenceGain(seq: SequenceDef, t: number): number {
  const keys = seq.displayGainKeys
  if (!keys?.length) return seq.displayGain ?? 1
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [t1, g1] = keys[i]
    const [t0, g0] = keys[i - 1]
    if (t <= t1) return g0 + ((g1 - g0) * (t - t0)) / Math.max(1e-6, t1 - t0)
  }
  return keys[keys.length - 1][1]
}

/** Frame index shown for chapter progress t. */
export function sequenceFrame(seq: SequenceDef, t: number) {
  return Math.min(seq.frames - 1, Math.max(0, Math.round(clamp01(t) * (seq.frames - 1))))
}

export function sequenceFirstCamera(id: SequenceId): CameraPose {
  return sequenceCamera(SEQUENCES[id], 0)
}

export function sequenceLastCamera(id: SequenceId): CameraPose {
  return sequenceCamera(SEQUENCES[id], 1)
}

/**
 * Where the 16:10 "film" frame sits on a viewport of W x H CSS pixels. Landscape viewports cover-fit it; portrait
 * viewports fit it by width with a zoom and anchor its focus point. The image-sequence canvas draws frames with this
 * layout and the live camera uses the identical rectangle via PerspectiveCamera.setViewOffset, so both layers frame
 * the product exactly the same way on any screen.
 */
export interface FilmLayout {
  /** displayed film width/height */
  w: number
  h: number
  /** viewport offset inside the film frame (can be negative when the film is smaller than the viewport) */
  ox: number
  oy: number
}

/** Where `p` (world) lands in the 16:10 film frame of `pose`, as fractions (0..1, y down). */
export function projectToFilm(pose: CameraPose, p: Vec3): [number, number] {
  const [px, py, pz] = pose.pos
  let fx = pose.target[0] - px, fy = pose.target[1] - py, fz = pose.target[2] - pz
  const fl = Math.hypot(fx, fy, fz) || 1
  fx /= fl; fy /= fl; fz /= fl
  // right = forward x up(0,1,0); up' = right x forward
  let rx = -fz, rz = fx
  const rl = Math.hypot(rx, rz) || 1
  rx /= rl; rz /= rl
  const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy
  const vx = p[0] - px, vy = p[1] - py, vz = p[2] - pz
  const zc = vx * fx + vy * fy + vz * fz
  const xc = vx * rx + vz * rz
  const yc = vx * ux + vy * uy + vz * uz
  const t = Math.tan((pose.fov * Math.PI) / 360)
  const nx = xc / (Math.max(0.01, zc) * t * FILM.aspect)
  const ny = yc / (Math.max(0.01, zc) * t)
  return [0.5 + nx / 2, 0.5 - ny / 2]
}

/**
 * Where the 16:10 film frame sits on the full-viewport canvas (W x H CSS px).
 *
 * `comp` (composition.ts, a pure function of scroll progress) places the pose's subject at (comp.x, comp.y) of the
 * viewport and scales the film to comp.s x the composition base (see below). The frames are rendered on a transparent
 * film, so the film edge is never visible. The image-sequence canvas draws its frames with this rectangle and the live
 * camera uses the identical one via setViewOffset, so frames and model stay locked together.
 */
export function filmLayout(W: number, H: number, pose?: CameraPose, comp?: Composition): FilmLayout {
  const c = comp ?? { x: 0.5, y: 0.5, s: 1 }
  // landscape: the viewport height, but never wider than the screen's 16:10 share (tablets and 4:3 laptops keep the
  // same horizontal footprint, so the chapter text keeps its column); portrait: at most 1.6 x the width
  const base = W / H >= 1.15 ? Math.min(H, W / FILM.aspect) : Math.min(H, W * 1.6)
  const h = base * c.s
  const w = h * FILM.aspect
  const [sx, sy] = pose ? projectToFilm(pose, pose.subject) : [0.5, 0.5]
  const oy = sy * h - c.y * H
  // pinned: the film top (screen y = -oy) may not come below the screen top
  return { w, h, ox: sx * w - c.x * W, oy: c.pin ? oy + c.pin * Math.max(0, -oy) : oy }
}
