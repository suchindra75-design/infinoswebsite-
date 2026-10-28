import { COMPANY } from '@/content/company'

export type NavAnchor = {
  label: string
  href: string
  narrative: boolean
}

export const NAV_LINKS: NavAnchor[] = [
  { label: 'Product', href: '#narrative', narrative: true },
  { label: 'Applications', href: '#applications', narrative: false },
  { label: 'Technology', href: '#technology', narrative: false },
  { label: 'Impact', href: '#impact', narrative: false },
  { label: 'Range', href: '#products', narrative: false },
  { label: 'Contact', href: '#contact', narrative: false },
]

export const BRAND = {
  name: 'INFINOS',
  suffix: 'TECH',
  /** owner, positioning correction: a cold-chain technology company, not only a diagnostic one */
  tagline: 'Smart cold-chain technology',
  scrollHint: 'SCROLL',
}

/** Public contact — read from the central company identity (content/company.ts). */
export const CONTACT = {
  email: COMPANY.email,
  altEmail: COMPANY.altEmail,
  website: COMPANY.website,
  websiteUrl: COMPANY.websiteUrl,
}
