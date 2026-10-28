/**
 * "Our Ecosystem" — organisations connected with INFINOS and the VentureRISE recognition (owner, 2026-10-15).
 *
 * Logos are the original files from the previous INFINOS website (approved download, 2026-10-15), encoded by
 * tools/encode_gallery_ecosystem.mjs: trimmed to their own artwork only, never redrawn, recoloured or stretched. The
 * Amrita TBI mark is taken from its "Funded by Amrita TBI" banner without the "Funded by" text, because the funding
 * wording is unconfirmed (owner label: institutional support, subject to confirmation).
 *
 * RELATIONSHIPS: as listed on the previous website, with the owner's cautious labels. Earlier collaborations are never
 * presented as current partnerships. NOT published (owner, 2026-10-15): DPIIT recognition — unverified for the
 * current Private Limited company; it stays in docs/MIGRATION_COMPANY_INFO.md as pending.
 */
export type Relationship = 'earlier-registration' | 'institutional-support' | 'featured' | 'earlier-collaboration'

export const RELATIONSHIP_LABEL: Record<Relationship, string> = {
  'earlier-registration': 'Earlier registration',
  'institutional-support': 'Institutional support',
  featured: 'Featured',
  'earlier-collaboration': 'Earlier collaboration',
}

export interface EcosystemLogo {
  id: string
  /** the organisation's name exactly as known (alt text); never expanded or invented */
  name: string
  src: string
  width: number
  height: number
  relationship: Relationship
  /** logos supplied on a white background: blended into the plate so no second white box shows */
  blend?: boolean
  /** what still needs the owner's confirmation */
  pending: string
}

export const ECOSYSTEM = {
  kicker: 'Ecosystem',
  title: 'Our Ecosystem.',
  lede: 'Programmes, institutions and organisations connected with INFINOS, each shown with its relationship.',
  note: 'Relationships as listed on the previous INFINOS website. Earlier collaborations are not necessarily current partnerships.',
  logos: [
    { id: 'startup-india', name: 'Startup India', src: '/images/ecosystem/startup-india.png', width: 654, height: 146, relationship: 'earlier-registration', pending: 'Historical registration claim; current status for the Private Limited company to be verified.' },
    { id: 'amrita-tbi', name: 'Amrita TBI', src: '/images/ecosystem/amrita-tbi.png', width: 101, height: 99, relationship: 'institutional-support', pending: 'Institutional support, subject to confirmation ("supported" or "funded"; period). Only a 101 px original is available.' },
    { id: 'agnii', name: 'Agnii', src: '/images/ecosystem/agnii.png', width: 139, height: 91, relationship: 'featured', blend: true, pending: 'Year of the feature, if wanted. Only a small original is available.' },
    { id: 'astromerge', name: 'Astromerge', src: '/images/ecosystem/astromerge.png', width: 640, height: 114, relationship: 'earlier-collaboration', pending: 'Earlier collaboration; nature and dates.' },
    { id: 'lunar-mission-one', name: 'Lunar Mission One', src: '/images/ecosystem/lunar-mission-one.png', width: 320, height: 320, relationship: 'earlier-collaboration', pending: 'Earlier collaboration; nature and dates.' },
    { id: 'wh-plus', name: 'WH+', src: '/images/ecosystem/wh-plus.png', width: 282, height: 116, relationship: 'earlier-collaboration', blend: true, pending: 'Earlier collaboration; the organisation is shown as "WH+" only (owner).' },
    { id: 'heliox-cosmos', name: 'HelioX Cosmos', src: '/images/ecosystem/heliox-cosmos.webp', width: 320, height: 320, relationship: 'earlier-collaboration', blend: true, pending: 'Earlier collaboration; nature and dates.' },
  ] satisfies EcosystemLogo[],
  /**
   * VentureRISE (owner, 2026-10-15): INFINOSTECH PVT. LTD. selected among the Top 16 startups, VentureRISE Global
   * Startup Challenge 2024/25, ESDM category — a recognition, not a win or award. The certificate image was not among
   * the files received (2026-10-15): `certificate` stays null and no "View certificate" control exists yet. The viewer
   * is built and tested once the exact certificate file is supplied. Never recreate the certificate.
   */
  recognition: {
    label: 'Recognition',
    statement: 'Selected among the Top 16 startups',
    detail: 'VentureRISE Global Startup Challenge 2024/25 · ESDM category',
    certificate: null as null | { src: string; width: number; height: number; alt: string },
  },
}
