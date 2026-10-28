/**
 * INFINOS company identity — the ONE place for the company's legal name, public contact details and external links.
 * Components read from here (through `CONTACT` in site.ts and `POSITIONING` in platform.ts); nothing company-specific
 * is hardcoded in a component.
 *
 * PUBLICATION RULE (owner, company-information migration): everything in this file is published. Links open in a new
 * tab with rel="noopener noreferrer" (components/sections/PlatformSections.tsx, `ExternalLink`). Information found on
 * the previous website (infinostech.com, from before the company became a Private Limited company) is added here only
 * after the owner approves it — the inventory and the status of every item are in docs/MIGRATION_COMPANY_INFO.md.
 * Unapproved values are kept out of this file on purpose: anything in src/ ships in the page's JavaScript, even when it
 * is not rendered.
 *
 * LEGAL IDENTITY: `legalName` is the registered name of the Private Limited company, confirmed by the owner
 * (2026-10-16; migration doc, item L1). Use it exactly wherever the legal name appears; the brand stays INFINOS /
 * INFINOS Tech. The former partnership-era name must not appear anywhere. No CIN, registered office or GSTIN until the
 * owner supplies them (items L4, L5).
 */
export interface CompanyLink {
  id: string
  label: string
  href: string
}

/** the official social accounts the site has icons for; add an icon (components/sections/SocialIcon.tsx) with a new id */
export type SocialId = 'facebook' | 'instagram' | 'x' | 'medium'

export interface SocialLink extends CompanyLink {
  id: SocialId
  /** accessible name, when the visible label alone is ambiguous */
  name?: string
}

/** official social accounts, supplied by the owner (2026-10-15); shown in the footer and the Contact section */
const SOCIAL: SocialLink[] = [
  { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/Infinos/' },
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/infinostech/' },
  { id: 'x', label: 'X', name: 'X (formerly Twitter)', href: 'https://x.com/Infinostech' },
  { id: 'medium', label: 'Medium', href: 'https://medium.com/@infinostech' },
]

/** external business listings (not social accounts), supplied by the owner (2026-10-15); Contact section only */
const LISTINGS: CompanyLink[] = [
  {
    id: 'justdial',
    label: 'Justdial',
    href: 'https://www.justdial.com/Hyderabad/Infinos-INSIDE-IIIT-HYDERABD-CAMPUS-Gachibowli/040PXX40-XX40-180615145522-A3R8_BZDET',
  },
]

export const COMPANY = {
  brand: 'INFINOS',
  legalName: 'INFINOSTECH PRIVATE LIMITED',
  website: 'www.infinostech.com',
  websiteUrl: 'https://www.infinostech.com',
  /** owner's final content, 2026-10-13 */
  email: 'contact@infinostech.com',
  altEmail: 'infinostech@gmail.com',
  /** approved phone numbers and addresses only (none approved yet) */
  phones: [] as CompanyLink[],
  addresses: [] as { id: string; label: string; lines: string[] }[],
  social: SOCIAL,
  listings: LISTINGS,
}
