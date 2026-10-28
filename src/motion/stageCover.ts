import { requestFrame } from './frameLoop'

/**
 * Set while the coolant showcase's studio backdrop fully covers the fixed product stage and story overlay (after the
 * bag story has dissolved away). Covered layers are hidden and the live 3D bag is not rendered — they are invisible,
 * so rendering them would only cost a second full-screen WebGL scene per frame. Uncovering happens while the
 * backdrop is still opaque and requests a frame, so the bag is current again before it can be seen.
 */
export const stageCover = { covered: false }

export function setStageCovered(covered: boolean) {
  if (stageCover.covered === covered) return
  stageCover.covered = covered
  document.documentElement.classList.toggle('stage-covered', covered)
  if (!covered) requestFrame()
}
