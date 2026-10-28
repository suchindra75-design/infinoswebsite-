import type { SocialId } from '@/content/company'

/**
 * Monochrome marks for the official INFINOS social accounts (content/company.ts). They take the surrounding text
 * colour, so hover and focus colours come from the link. Decorative: the link carries the accessible name.
 */
const MARKS: Record<SocialId, React.ReactNode> = {
  // a disc with the "f" cut out
  facebook: (
    <path
      fillRule="evenodd"
      d="M12 0a12 12 0 1 0 0 24a12 12 0 1 0 0-24ZM13.25 24v-9.6h3.13l.5-3.62h-3.63V8.5c0-1.05.3-1.77 1.8-1.77h1.92V3.5a25 25 0 0 0-2.8-.15c-2.78 0-4.68 1.7-4.68 4.8v2.63H6.36v3.62h3.13V24Z"
    />
  ),
  instagram: (
    <>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.4" cy="6.6" r="1.25" />
    </>
  ),
  x: <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.59l5.24 6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3Z" />,
  medium: (
    <>
      <ellipse cx="6.77" cy="12" rx="6.77" ry="6.82" />
      <ellipse cx="17.58" cy="12" rx="3.38" ry="6.42" />
      <ellipse cx="22.81" cy="12" rx="1.19" ry="5.75" />
    </>
  ),
}

export function SocialIcon({ id }: { id: SocialId }) {
  return (
    <svg className="sx-social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      {MARKS[id]}
    </svg>
  )
}
