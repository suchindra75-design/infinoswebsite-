/**
 * Phone layout: the SAME media query as the CSS phone layout (globals.css `(max-aspect-ratio: 23/20) and
 * (max-width: 699px)`, which is composition.ts layoutMode 'phone'). Phones play the complete desktop story, composed
 * for a tall screen; the scroll region is a little shorter there (globals.css), so a switch between layouts
 * (rotation) re-measures it and keeps the visitor's story moment (ScrollChapterController).
 */
export const PHONE_QUERY = '(max-aspect-ratio: 23/20) and (max-width: 699px)'

export function isPhoneLayout(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(PHONE_QUERY).matches
}
