import type { HotspotId } from '@/state/experienceStore'
import { sequenceLastCamera } from '@/motion/sequences'

export interface Hotspot {
  id: HotspotId
  label: string
  text: string
  /** anchor in the model root's local space (glTF metres), measured on the v0.3 model (tools/t1_model_report.json) */
  anchor: [number, number, number]
  /** outward surface direction at the anchor (unrotated model) */
  normal: [number, number, number]
}

/** Descriptions stay at what the reference photographs show — no performance or certification claims. */
export const HOTSPOTS: Hotspot[] = [
  {
    id: 'flap',
    label: 'QUILTED OUTER FLAP',
    text: 'Padded red cover with wave-quilted channels and black binding. It folds over the top-loading upper chamber — Zone 1.',
    anchor: [0.07, 0.457, 0.194],
    normal: [0, 0.25, 1],
  },
  {
    id: 'display',
    label: 'ON-BOARD DISPLAY',
    text: 'An OLED readout on a black acrylic plate, fixed to the upper side panel. Readings shown are as photographed, not specifications.',
    anchor: [0.2265, 0.31, 0.006],
    normal: [1, 0, 0],
  },
  {
    id: 'dropPanel',
    label: 'DROP-DOWN FRONT PANEL',
    text: 'Zips open on three sides and folds down to open the lower chamber — Zone 2 — and its removable, silver-lined inner box.',
    anchor: [-0.06, 0.132, 0.203],
    normal: [0, 0, 1],
  },
  {
    id: 'biohazard',
    label: 'BIOHAZARD MARKING',
    text: 'Embroidered on both lower side panels: the container is built for diagnostic sample transport.',
    anchor: [-0.2185, 0.11, 0.024],
    normal: [-1, 0, 0],
  },
]

/** Yaw that turns a hotspot's surface toward the hero camera (the hero view is the end of the reveal sequence). */
export function hotspotYaw(h: Hotspot): number {
  const cam = sequenceLastCamera('reveal').pos
  const camAzimuth = Math.atan2(cam[0], cam[2])
  const normalAzimuth = Math.atan2(h.normal[0], h.normal[2])
  let yaw = camAzimuth - normalAzimuth
  while (yaw > Math.PI) yaw -= 2 * Math.PI
  while (yaw < -Math.PI) yaw += 2 * Math.PI
  return yaw
}
