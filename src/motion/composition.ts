import { smoothstep } from '@/motion/sequences'
import PHONE from '@/content/phoneComposition.json'
import { smallViewportHeight } from '@/hooks/environment'

/**
 * Editorial composition: where the product sits on screen, chapter by chapter, as a pure function of scroll progress.
 *
 * The camera track (cameraTrack.ts) decides WHAT we see; this track decides WHERE on the screen it is composed, so the
 * headline of each chapter can sit in the negative space beside (desktop) or below (portrait) the product. Keys are
 * eased with smoothstep (zero velocity at every key), and each move coincides with a camera move, so the product
 * glides into its new composition instead of jumping. Both the photoreal frames and the live camera use it
 * (filmLayout), and scrolling back retraces it exactly.
 */
export type LayoutMode = 'landscape' | 'portrait' | 'phone'

/** subject position (fractions of the viewport) and product scale (1 = film as tall as the composition base) */
export interface Composition {
  x: number
  y: number
  s: number
  /**
   * 0..1: keep the film's top edge at or above the screen top. The open-sequence frames crop the raised flap, lid and
   * upper body at the top of their film (81 of 120 frames); a film edge inside the screen would show as a hard cut.
   * Ramped in before those frames appear and out after they hand back to the live model, so it is continuous.
   */
  pin?: number
}

export function layoutMode(W: number, H: number): LayoutMode {
  if (W / H >= 1.15) return 'landscape'
  return W >= 700 ? 'portrait' : 'phone'
}

type Key = [progress: number, x: number, y: number, s: number]

/*
 * Chapter ranges (chapters.ts STORY_RANGES): 01 overview 0–.19 · 02 exterior .19–.31 · 03 insulation .31–.393 ·
 * 04 compartments .393–.456 · 05 inner box .456–.518 · 06 lining & rack .518–.69 · 07 display .69–.83 · 08 .83–1
 */
const TRACKS: Record<Exclude<LayoutMode, 'phone'>, Key[]> = {
  // text beside the product: 01–02 product right · 03–05 left · 06 right · 07 left · 08 right of the text.
  // Close-ups (02 exterior, 07 display) are composed smaller so they never run under the headline or the navigation;
  // open views (03–06) get extra headroom for the raised lids.
  landscape: [
    [0, 0.5, 0.5, 1.0], // the reveal starts centred (the agreed 4 s opening)
    [0.075, 0.63, 0.52, 0.9],
    [0.19, 0.63, 0.52, 0.9],
    [0.217, 0.65, 0.54, 0.8],
    [0.295, 0.65, 0.54, 0.8],
    // the open sequence begins on a tight front close-up: composed small, then it grows as the camera pulls back
    [0.318, 0.5, 0.52, 0.72],
    [0.36, 0.38, 0.5, 0.92],
    [0.4, 0.38, 0.5, 1.04],
    [0.45, 0.38, 0.5, 1.04],
    [0.478, 0.38, 0.5, 0.95],
    [0.505, 0.38, 0.5, 0.95],
    // the open sequence ends top-down: composed large while its frames are pinned, settling as the live view takes over
    [0.545, 0.61, 0.55, 0.9],
    [0.57, 0.61, 0.56, 0.88],
    [0.61, 0.61, 0.64, 0.62],
    [0.69, 0.61, 0.64, 0.62],
    [0.728, 0.39, 0.53, 0.74],
    [0.83, 0.39, 0.53, 0.74],
    [0.87, 0.64, 0.51, 0.88],
    [1, 0.64, 0.51, 0.88],
  ],
  // tablet portrait: the product in the upper part (clear of the chapter text in the lower ~40 %)
  portrait: [
    [0, 0.5, 0.5, 0.8],
    [0.065, 0.5, 0.33, 0.68],
    [0.19, 0.5, 0.33, 0.68],
    [0.217, 0.5, 0.32, 0.54],
    [0.295, 0.5, 0.32, 0.54],
    [0.345, 0.5, 0.34, 0.66],
    [0.505, 0.5, 0.34, 0.66],
    [0.545, 0.5, 0.34, 0.7],
    [0.57, 0.5, 0.34, 0.68],
    [0.61, 0.5, 0.36, 0.58],
    [0.69, 0.5, 0.36, 0.58],
    [0.728, 0.5, 0.32, 0.54],
    [0.83, 0.5, 0.32, 0.54],
    [0.87, 0.5, 0.33, 0.6],
    [1, 0.5, 0.33, 0.6],
  ],
}

/** the largest composition scale used on this layout (decides which frame set a screen needs) */
export function maxScale(mode: LayoutMode) {
  // phones: the reveal frames are drawn at most ~0.8 of the composition base (the fit below rarely goes higher), so
  // the 1600 px frame set serves them
  if (mode === 'phone') return 0.8
  return Math.max(...TRACKS[mode].map((k) => k[3]))
}

/** open sequence on screen (0.31–0.57, frames faded in/out at the edges): pin the film top */
export function pinAt(progress: number) {
  return smoothstep(0.296, 0.31, progress) * (1 - smoothstep(0.575, 0.605, progress))
}

/*
 * Phones are composed from the product itself rather than from keys. tools/phone_composition.mjs measured where the
 * whole product — raised flap, opened lids, inner box, exploded layers — lands in the film at every 0.002 of progress
 * (phoneComposition.json); here that rectangle is fitted into the product zone of the actual screen: below the
 * navigation bar, above the chapter text, with a little air. The bag is therefore always whole and centred in its
 * zone, on any phone, in every chapter; the camera's own moves (orbits, the opening, the exploded view) still play,
 * while its push-ins become a steady product size. The opening starts from the desktop's centred first image (the
 * intro's iris opens on it) and settles into the zone while chapter 01 appears.
 */
const PHONE_STEP = PHONE.step
const PHONE_RECTS = PHONE.rects as number[][]
const PHONE_OPENING = { x: 0.5, y: 0.5, s: 0.8 }
const PHONE_SETTLE = 0.045
const PHONE_MAX_S = 1.15
/** the nav bar (64 px) and a margin below it */
export const PHONE_TOP = 64 + 22
const phoneRect = [0, 0, 0, 0, 0, 0]

/**
 * Share of the screen width kept free on the right for labels drawn beside the product: the temperature-zone brackets
 * of chapter 02 (story.ts zones, 0.247–0.297), the display callout of chapter 07 and the layer labels of the exploded
 * overview (ComponentLabels.tsx). Eased in and out with the composition, so the product glides aside before they appear.
 */
function phoneAside(p: number) {
  const zones = smoothstep(0.228, 0.247, p) * (1 - smoothstep(0.297, 0.312, p))
  const overview = smoothstep(0.83, 0.865, p)
  return Math.max(zones * 0.3, overview * 0.4)
}

/**
 * The product zone of every chapter on this phone (StoryOverlay.tsx measures the chapter text and publishes where it
 * sits): each chapter has its own composition (story.ts PhoneVariant), so the product is fitted above, below or between
 * the text. Pixels of the stage; `null` until the overlay has measured (the default zone sits above a foot block).
 */
export interface PhoneZone {
  t: number
  b: number
  l: number
  r: number
}
let phoneZones: { zones: PhoneZone[]; bounds: number[] } | null = null

/**
 * The overlay's measurement: one zone per story chapter, with the chapter boundaries. Every layer that composes the
 * product (the live camera, the photoreal frames, the studio, the callouts) reads these same zones, whatever size it
 * measured the stage at itself: they each measure it differently (a ResizeObserver, getBoundingClientRect, the
 * canvas), and on a real phone those disagree in the last decimals — an exact size key made the canvases fall back to a
 * default zone while the callouts used the measured one (the bag over the chapter text, the brackets below it). The
 * overlay re-measures on every resize, so the zones always belong to the current screen.
 */
export function setPhoneZones(zones: PhoneZone[], bounds: number[]) {
  phoneZones = { zones, bounds }
}

/** half-width (progress) of the glide from one chapter's zone into the next, centred on the boundary */
const ZONE_GLIDE = 0.013
const zoneTmp: PhoneZone = { t: 0, b: 0, l: 0, r: 0 }

function phoneZoneAt(p: number, W: number, H: number, Hs: number): PhoneZone {
  if (!phoneZones) {
    zoneTmp.l = 18
    zoneTmp.r = W - 18
    zoneTmp.t = PHONE_TOP
    zoneTmp.b = Math.max(zoneTmp.t + 160, Hs * 0.62 - 26 - 16)
    return zoneTmp
  }
  const { zones, bounds } = phoneZones
  // the chapter whose zone applies, and the glide into the next one around each boundary
  let i = 0
  while (i < bounds.length && p >= bounds[i] + ZONE_GLIDE) i++
  const a = zones[Math.min(i, zones.length - 1)]
  const next = zones[Math.min(i + 1, zones.length - 1)]
  const t = i < bounds.length ? smoothstep(bounds[i] - ZONE_GLIDE, bounds[i] + ZONE_GLIDE, p) : 0
  zoneTmp.t = a.t + (next.t - a.t) * t
  zoneTmp.b = a.b + (next.b - a.b) * t
  zoneTmp.l = a.l + (next.l - a.l) * t
  zoneTmp.r = a.r + (next.r - a.r) * t
  return zoneTmp
}

/** the bottom of the product zone at this progress (px of the stage) — the phone stage fades out below it */
export function phoneZoneBottom(progress: number, W: number, H: number) {
  const Hs = Math.min(H, smallViewportHeight() || H)
  // the opening starts centred and full size (PHONE_OPENING): the fade follows the bag as it settles into its zone
  const e = smoothstep(0, PHONE_SETTLE, progress)
  return H + (phoneZoneAt(progress, W, H, Hs).b - H) * e
}

function phoneComposition(progress: number, W: number, H: number, out: Composition): Composition {
  const f = Math.min(PHONE_RECTS.length - 1, Math.max(0, progress / PHONE_STEP))
  const i = Math.min(PHONE_RECTS.length - 2, Math.floor(f))
  const t = f - i
  const a = PHONE_RECTS[i]
  const b = PHONE_RECTS[i + 1]
  for (let k = 0; k < 6; k++) phoneRect[k] = a[k] + (b[k] - a[k]) * t
  const [x0, y0, x1, y1, sx, sy] = phoneRect
  // the zone this chapter leaves the product: under the bar and above a foot block, below a top block, between a
  // headline and its body... — measured on the small viewport, where bottom-anchored text sits highest (address bar shown)
  const Hs = Math.min(H, smallViewportHeight() || H)
  const z = phoneZoneAt(progress, W, H, Hs)
  const zl = z.l
  const zr = Math.min(z.r, W - 18 - phoneAside(progress) * W)
  const zt = z.t
  const zb = Math.max(zt + 150, z.b)
  const base = Math.min(H, W * 1.6)
  const fill = 0.94
  const s = Math.min(PHONE_MAX_S, (fill * (zr - zl)) / ((x1 - x0) * 1.6 * base), (fill * (zb - zt)) / ((y1 - y0) * base))
  const h = base * s
  const w = h * 1.6
  const x = ((zl + zr) / 2 - ((x0 + x1) / 2 - sx) * w) / W
  const y = ((zt + zb) / 2 - ((y0 + y1) / 2 - sy) * h) / H
  const e = smoothstep(0, PHONE_SETTLE, progress)
  out.x = PHONE_OPENING.x + (x - PHONE_OPENING.x) * e
  out.y = PHONE_OPENING.y + (y - PHONE_OPENING.y) * e
  out.s = PHONE_OPENING.s + (s - PHONE_OPENING.s) * e
  // phones show the open chapters on the live model (chapters.ts framesFor): nothing to pin
  out.pin = 0
  return out
}

/**
 * The composition at a story progress. The stage size (W x H, CSS px) is needed for phones, whose composition is fitted to
 * the screen; the other layouts are proportional and ignore it.
 */
export function compositionAt(progress: number, mode: LayoutMode, out: Composition = { x: 0.5, y: 0.5, s: 1 }, W = 390, H = 844): Composition {
  if (mode === 'phone') return phoneComposition(progress, W, H, out)
  out.pin = pinAt(progress)
  const keys = TRACKS[mode]
  if (progress <= keys[0][0]) return set(out, keys[0])
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i]
    if (progress <= b[0]) {
      const a = keys[i - 1]
      const t = smoothstep(a[0], b[0], progress)
      out.x = a[1] + (b[1] - a[1]) * t
      out.y = a[2] + (b[2] - a[2]) * t
      out.s = a[3] + (b[3] - a[3]) * t
      return out
    }
  }
  return set(out, keys[keys.length - 1])
}

function set(out: Composition, k: Key) {
  out.x = k[1]
  out.y = k[2]
  out.s = k[3]
  return out
}
