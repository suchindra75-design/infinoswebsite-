/**
 * Coolant showcase timeline and art direction: a pure function of the section's own scroll position, like the
 * narrative.
 *
 *   s = -sectionTop / viewportHeight
 *
 * The section overlaps the last screen of the narrative (CSS margin-top: -100vh), so s = 0 is the exact moment the
 * bag story completes (its ScrollTrigger ends 'bottom bottom'), and the stage is already pinned full-screen there.
 * From that point, all in the pinned stage, never lower on the screen:
 *
 *   0.00 – 0.24  the bag story dissolves away: the coolant stage's backdrop is the product stage's own studio
 *                background, so only the bag, its labels and the chapter text fade — the studio itself stays
 *   0.14 – 0.82  ORGANIC (blue) is laid into the fan from its own side; it becomes noticeable just as the story has
 *                gone (no empty frame, and it never crosses the chapter text), lowering onto the table as it settles
 *   0.20 – 0.90  a soft pool of light gathers behind the fan
 *   0.05 – 1.50  the camera settles from a slightly higher, wider view into the hero angle
 *   0.46 – 1.14  INORGANIC (white) joins it
 *   0.78 – 1.46  EUTECTIC (beige) completes the fan
 *   1.34 – 1.80  the light settles: full key, crisper contact shadows
 *   1.46 – 1.66  all three packs have landed: the family introduction (kicker, headline, hint) fades in, and from
 *                here a selected coolant's information may open (phase 2, owner 2026-10-15)
 *   …    – 2.90  the finished fan holds — about half a screen longer than before, as reading time; then the next
 *                section scrolls in
 *
 * Scrolling back above the completed fan (below RETURN_BELOW) restores the family view, so a pulled-forward pack
 * never mixes with the reversed dealing animation.
 *
 * World units are pack widths (W = 1; the model is exported at W = 0.1 m and scaled by MODEL_SCALE). y is up; the
 * camera looks down at the fan from the +z side, so "up the screen" is -z.
 */

/** pinned scroll length in viewport heights (the section is PINNED_SPAN + 1 viewports tall, starting 1 viewport early) */
export const PINNED_SPAN = 2.9

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const span = (s: number, a: number, b: number) => clamp01((s - a) / (b - a))

export const smooth = (t: number) => t * t * (3 - 2 * t)
export const smoother = (t: number) => t * t * t * (t * (6 * t - 15) + 10)
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

const ENTER: [number, number][] = [
  [0.14, 0.82],
  [0.46, 1.14],
  [0.78, 1.46],
]

/** 0..1 entry progress of the pack in fan slot i (0 = left / back, 1 = middle, 2 = right / front) */
export const entryAt = (slot: number, s: number) => span(s, ENTER[slot][0], ENTER[slot][1])
/** studio backdrop over the finished bag story */
export const backdropAt = (s: number) => smooth(span(s, 0, 0.24))
/** from here the backdrop is opaque: the product stage underneath is hidden and not rendered (stageCover.ts) */
export const COVER_FROM = 0.25
/** light pool behind the fan */
export const poolAt = (s: number) => smooth(span(s, 0.2, 0.9))
/** camera settle */
export const cameraAt = (s: number) => smoother(span(s, 0.05, 1.5))
/** final light settle once the fan is complete */
export const settleAt = (s: number) => smooth(span(s, 1.34, 1.8))
/** the selector appears with the first pack */
export const pickerAt = (s: number) => smooth(span(s, 0.32, 0.62))
/** all three packs have landed: information may open from here */
export const INFO_FROM = 1.46
/** the family introduction (kicker, headline, hint) */
export const familyAt = (s: number) => smooth(span(s, INFO_FROM, 1.66))
/** scrolling back across this point (upwards) restores the family view */
export const RETURN_BELOW = 1.4

export const MODEL_SCALE = 10
/** body length and (estimated) thickness of the pack, in W */
export const PACK = { length: 1.84, thickness: 0.28 } as const

export type LayoutMode = 'desktop' | 'tabletL' | 'tabletP' | 'phone' | 'phoneL'

/** fan geometry */
export interface Fan {
  /** rotation between neighbouring packs (rad) */
  angle: number
  /** extra sideways spread between neighbours, so more of each face stays visible */
  spread: number
  /** distance from the shared pivot to the packs' lower ends */
  pivot: number
  /** height step between the three layers (thickness + a hairline gap) */
  pitch: number
  /** height x cot(camera elevation): keeps the layers level on screen (see fanPose) */
  level: number
  /** a slight turn of the whole fan about its pivot, balancing the front card's extra visual weight */
  roll: number
}

/** per-layout art direction: fan shape, camera, and how much of the free area the fan may fill */
export interface Direction {
  mode: LayoutMode
  fan: Fan
  elevation: number
  fov: number
  /** share of the free width / height (left by the navigation and the selector) the resting fan fills */
  fillW: number
  fillH: number
  /** the camera's settle starts this much higher (rad) and further away (factor) */
  startElevation: number
  startDistance: number
  /**
   * Focus (a coolant selected, its information open): the whole fan glides left by this share of the screen width —
   * a screen-space view offset only, nothing in the scene moves — and the information takes a column on the right
   * (the bag story's MOVE language). 0 = the fan stays and the information uses the free bands (portrait / phones).
   */
  focusShift: number
}

export function layoutMode(w: number, h: number): LayoutMode {
  if (h < 500 && w > h) return 'phoneL'
  if (w <= 600 && h >= w) return 'phone'
  if (w < h) return 'tabletP'
  if (w / h < 1.5 || w < 1200) return 'tabletL'
  return 'desktop'
}

function fan(angle: number, spread: number, elevation: number, roll = 0.035): Fan {
  return { angle, spread, pivot: 0.12, pitch: 0.31, level: 1 / Math.tan(elevation), roll }
}

export function direction(w: number, h: number): Direction {
  const mode = layoutMode(w, h)
  switch (mode) {
    case 'phone':
      // narrow screens: the width sets the scale, so a slightly tighter fan seen from higher up lets the packs grow
      // and shows more of each face, using the tall screen without turning the fan into a tower
      return { mode, fan: fan(0.34, 0.16, 1.2), elevation: 1.2, fov: 26, fillW: 0.94, fillH: 0.62, startElevation: 0.1, startDistance: 1.05, focusShift: 0 }
    case 'tabletP':
      return { mode, fan: fan(0.36, 0.2, 1.15), elevation: 1.15, fov: 24, fillW: 0.84, fillH: 0.6, startElevation: 0.1, startDistance: 1.05, focusShift: 0 }
    case 'phoneL':
      // height is scarce: the selector moves to the side (CSS) and the fan uses almost the full height
      return { mode, fan: fan(0.42, 0.3, 0.98), elevation: 0.98, fov: 22, fillW: 0.78, fillH: 0.92, startElevation: 0.1, startDistance: 1.05, focusShift: 0 }
    case 'tabletL':
      return { mode, fan: fan(0.42, 0.28, 1.0), elevation: 1.0, fov: 22, fillW: 0.74, fillH: 0.84, startElevation: 0.14, startDistance: 1.06, focusShift: 0.18 }
    default:
      return { mode, fan: fan(0.42, 0.3, 1.0), elevation: 1.0, fov: 22, fillW: 0.7, fillH: 0.86, startElevation: 0.14, startDistance: 1.06, focusShift: 0.18 }
  }
}

export interface Pose {
  x: number
  y: number
  z: number
  /** rotation about the vertical axis; positive leans the pack's top (cap) end to the left */
  yaw: number
  scale: number
}

const layerY = (layer: number, f: Fan) => PACK.thickness / 2 + layer * f.pitch
/**
 * Seen from above at an angle, a pack's height also shifts it up the screen, which would tip the fan (the back card
 * low, the front card high). Each layer is moved toward the viewer by height x cot(elevation) to cancel that, so the
 * fan reads level, and a pack lifted out of it comes toward the viewer instead of drifting up the screen.
 */
const levelZ = (y: number, f: Fan) => (y - layerY(1, f)) * f.level

/** resting pose of the pack in fan slot i: rotated about the shared pivot, layered back (left) to front (right) */
export function fanPose(slot: number, f: Fan): Pose {
  const k = slot - 1
  const yaw = -k * f.angle + f.roll
  const r = f.pivot + PACK.length / 2
  const y = layerY(slot, f)
  // the sideways spread turns with the fan
  const sx = k * f.spread * Math.cos(f.roll)
  const sz = -k * f.spread * Math.sin(f.roll)
  return { x: -Math.sin(yaw) * r + sx, y, z: r - Math.cos(yaw) * r + sz + levelZ(y, f), yaw, scale: 1 }
}

/**
 * Where a pack is laid in from: raised above the table and out to its own side (the left pack from the left, the
 * right one from the right, the middle one from just beyond its place), turned a little further out. The raise is
 * levelled like the layers, so the pack keeps its height on screen: it glides in sideways, decelerating, and lowers
 * onto the table last, so its shadow gathers beneath it as it lands. Nothing travels through the top of the frame.
 */
export function entryStart(slot: number, f: Fan): Pose {
  const p = fanPose(slot, f)
  const k = slot - 1
  const y = p.y + 0.7
  return {
    x: p.x + k * 0.5 - Math.sin(p.yaw) * 0.2,
    y,
    z: p.z - levelZ(p.y, f) + levelZ(y, f) - Math.cos(p.yaw) * 0.2 - (k === 0 ? 0.35 : 0),
    yaw: p.yaw - k * 0.22,
    scale: 1,
  }
}

/**
 * Selection: like pulling one card forward from a fan. The pack keeps its fan angle, slides a little out along its
 * own axis, lifts just above the other two (toward the viewer) and grows gently.
 */
export const SELECT = { slide: 0.12, clear: 0.08, grow: 0.06 } as const

export function selectedPose(slot: number, f: Fan): Pose {
  const p = fanPose(slot, f)
  const y = layerY(3, f) + SELECT.clear
  return {
    x: p.x - Math.sin(p.yaw) * SELECT.slide,
    y,
    z: p.z - levelZ(p.y, f) + levelZ(y, f) - Math.cos(p.yaw) * SELECT.slide,
    yaw: p.yaw,
    scale: 1 + SELECT.grow,
  }
}
