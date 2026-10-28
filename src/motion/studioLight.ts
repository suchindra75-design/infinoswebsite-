import { smoothstep } from '@/motion/sequences'

/**
 * The live model's floor shadows, as pure functions of story progress, matched to the photoreal frames at every
 * hand-over (measured side by side on the lit floor, frames vs live at the same scroll position):
 *  - the reveal (-> hero at 0.11) and the end of the open sequence (-> interior at 0.57) carry a contact shadow only;
 *  - the open sequence begins (0.31) with a dense forward shadow from the lights behind the bag, so that shadow (and a
 *    deeper contact shadow) builds through chapter 02 and has left again under the frames, before the live interior.
 * Both values are material uniforms, written every rendered frame (StudioShadow and ShadowCatcher, ProductCanvasInner).
 */
export function forwardShadowWeight(progress: number) {
  return 0.95 * smoothstep(0.215, 0.3, progress) * (1 - smoothstep(0.5, 0.56, progress))
}

export function contactShadowOpacity(progress: number) {
  return 0.6 + 0.4 * smoothstep(0.215, 0.3, progress) * (1 - smoothstep(0.5, 0.56, progress))
}

/**
 * The atelier's daylight through the story (StudioEnvironment): one room, one light, only intensity and warmth drift —
 * cool morning light for the first look, warming slowly towards a late, low afternoon for the complete system.
 * Keys are eased (zero velocity at each), and every value is a layer opacity or scale on the compositor.
 */
export interface StudioLight {
  /** 0 = cool morning stone, 1 = warm late-afternoon stone (opacity of the warm layer) */
  warmth: number
  /** the window's spill on the wall */
  window: number
  /** the light pool on the floor around the bag, and its size relative to the projected footprint */
  pool: number
  poolSize: number
  /** the wash on the wall behind the product */
  wash: number
}

type LightKey = [progress: number, light: StudioLight]
const k = (p: number, warmth: number, window: number, pool: number, poolSize: number, wash: number): LightKey => [p, { warmth, window, pool, poolSize, wash }]

const LIGHT: LightKey[] = [
  k(0, 0, 1, 1, 1.2, 1), // 01 morning: the first look
  k(0.19, 0.1, 1, 1, 1.2, 1),
  k(0.31, 0.25, 1, 1, 1.1, 0.95), // 02-05 the day climbs while the bag opens
  k(0.6, 0.4, 1, 1, 1.1, 0.95),
  k(0.66, 0.6, 1, 1, 1.5, 0.75), // 06 seen from above: the floor is the backdrop
  k(0.73, 0.8, 0.85, 0.85, 1.0, 0.7), // 07 late, slightly lower light at the display
  k(0.88, 1, 1, 1, 1.0, 1.05), // 08 warm and even for the complete system
  k(1, 1, 1, 1, 1.0, 1.05),
]

export function studioLightAt(progress: number, out: StudioLight = { warmth: 0, window: 1, pool: 1, poolSize: 1, wash: 1 }): StudioLight {
  let a = LIGHT[0]
  let b = LIGHT[LIGHT.length - 1]
  for (let i = 1; i < LIGHT.length; i++) {
    if (progress <= LIGHT[i][0]) {
      a = LIGHT[i - 1]
      b = LIGHT[i]
      break
    }
  }
  const t = b[0] > a[0] ? smoothstep(a[0], b[0], progress) : 1
  for (const key of Object.keys(out) as (keyof StudioLight)[]) out[key] = a[1][key] + (b[1][key] - a[1][key]) * t
  return out
}
