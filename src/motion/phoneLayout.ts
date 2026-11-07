/**
 * Phone layout (approved mobile concept C, "Product page first": docs/design/mobile-concepts/board.html).
 *
 * The SAME media query as the CSS phone layout (globals.css `(max-aspect-ratio: 23/20) and (max-width: 699px)`, which
 * is composition.ts layoutMode 'phone'). On phones the scroll story keeps its three strongest moments — the reveal,
 * the lid opening, the inner box — and ends inside the open sequence, before the live hand-over; chapters 06–08 and
 * the coolants are presented as product-page blocks instead (PhoneProductPage). Desktop and tablets are unchanged.
 */
export const PHONE_QUERY = '(max-aspect-ratio: 23/20) and (max-width: 699px)'

/**
 * Story progress the phone story ends at: inside the open sequence (0.31–0.57), with the inner box out and its lid
 * opening, and before the frames start their cross-fade to the live model (sequence fade from 0.93 of the chapter).
 */
export const PHONE_STORY_END = 0.55

export function isPhoneLayout(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(PHONE_QUERY).matches
}
