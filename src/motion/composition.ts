import { smoothstep } from '@/motion/sequences'

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
const TRACKS: Record<LayoutMode, Key[]> = {
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
  // phones: the product in the upper half, text below
  phone: [
    // the opening at 0.8: the 1600 px phone frame set is drawn at (at most) its native size
    [0, 0.5, 0.5, 0.8],
    [0.065, 0.5, 0.31, 0.76],
    [0.19, 0.5, 0.31, 0.76],
    [0.217, 0.5, 0.31, 0.64],
    [0.295, 0.5, 0.31, 0.64],
    [0.345, 0.5, 0.33, 0.72],
    [0.505, 0.5, 0.33, 0.72],
    [0.545, 0.5, 0.33, 0.74],
    [0.57, 0.5, 0.33, 0.72],
    [0.61, 0.5, 0.35, 0.62],
    [0.69, 0.5, 0.35, 0.62],
    [0.728, 0.5, 0.31, 0.64],
    [0.83, 0.5, 0.31, 0.64],
    [0.87, 0.5, 0.32, 0.74],
    [1, 0.5, 0.32, 0.74],
  ],
}

/** the largest composition scale used on this layout (decides which frame set a screen needs) */
export function maxScale(mode: LayoutMode) {
  return Math.max(...TRACKS[mode].map((k) => k[3]))
}

/** open sequence on screen (0.31–0.57, frames faded in/out at the edges): pin the film top */
export function pinAt(progress: number) {
  return smoothstep(0.296, 0.31, progress) * (1 - smoothstep(0.575, 0.605, progress))
}

export function compositionAt(progress: number, mode: LayoutMode, out: Composition = { x: 0.5, y: 0.5, s: 1 }): Composition {
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
