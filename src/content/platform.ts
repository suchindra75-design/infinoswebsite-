import { COMPANY } from '@/content/company'
import { BRAND } from '@/content/site'

/**
 * INFINOS product platform — the single source of truth for product positioning, features, range, applications and
 * impact on the website.
 *
 * SOURCES, in order of authority:
 *   0. Positioning correction (owner): INFINOS is a smart cold-chain and temperature-controlled transportation
 *      technology company, NOT exclusively a healthcare or medical one. Healthcare and diagnostics stay an important
 *      application; the company-level copy must not imply that the current products are validated for every industry
 *      (see INDUSTRIES). Product-level copy (the diagnostic containers) is unchanged in substance.
 *   1. "INFINOS — Final Product Content" and "Final Content and Accuracy Pass" (owner, 2026-10-13): positioning,
 *      PCM-based thermal management, zones (Zone 1 = upper chamber), confirmed features, the product family, data
 *      logging (Flexible Container only), contact. Where they are stricter than the deck, they win.
 *   2. "DiagnoSmart – 10 lakhs ALEAP Pitch deck" (InfinosTech Pvt. Ltd.): printed slide numbers (p.03 = "The Solution",
 *      p.04 = impact, p.05 = competitive advantages, p.08 = product types & SKUs); the unnumbered first slide is the
 *      "title slide".
 *   3. The 13 product photographs for physical details (docs/MODEL_VALIDATION.md).
 *
 * STATUS drives the wording on the site, so a feature can be promoted in ONE place once it is confirmed
 * (see docs/REPORT_FINAL_CONTENT.md):
 *   available — confirmed as implemented (final content) or visible on the physical product; stated plainly
 *   designed  — part of the product design / concept; worded as design, never as demonstrated performance
 *   planned   — planned and not yet validated (final content: simultaneous two-zone operation)
 *   example   — an example configuration, not a guaranteed specification
 *   projected — a figure stated "at scale" in INFINOS planning material
 *   reported  — a performance figure not yet backed by published test results (kept unpublished: `publish: false`)
 */
export type Status = 'available' | 'designed' | 'planned' | 'example' | 'projected' | 'reported' | 'inDevelopment'

/** short public qualifier shown next to a feature or figure ('' = none) */
export const STATUS_TAG: Record<Status, string> = {
  available: '',
  designed: '',
  planned: 'Planned · awaiting validation',
  example: 'Example configuration',
  projected: 'Projected at scale',
  reported: 'Reported · validation pending',
  inDevelopment: 'In development',
}

export const POSITIONING = {
  company: COMPANY.brand,
  /** the registered name of the Private Limited company — content/company.ts */
  legalName: COMPANY.legalName,
  website: COMPANY.website,
  /** the variant modelled in 3D and shown in the 360° view (final content: "one of the product variants") */
  physical: 'INFINOS Pro Dual-Chamber Bag',
  /** positioning correction: the company, across industries (page title) */
  headline: 'INFINOS — Smart Cold-Chain & Temperature-Controlled Transportation Technology',
  /** the company: the broader direction, stated as intent — never as validated capability */
  companyLine:
    'INFINOS is a smart cold-chain and temperature-controlled transportation technology company. It develops technology designed to keep temperature-sensitive products within their required conditions while they travel.',
  /** what exists today: the developed products (final content: diagnostic samples and other healthcare materials) */
  currentLine:
    'Its current products are developed for healthcare and diagnostics: smart containers for the collection and transport of diagnostic samples.',
  /** final content, "Product description" */
  rangeLine:
    'The INFINOS product range includes variants of smart diagnostic transportation containers designed around organised compartments, PCM-based thermal management and sample-handling requirements.',
  /** accuracy pass: one family, one underlying bag design and team; the flexible form factor is the basis */
  familyLine:
    'The three INFINOS variants belong to one product family, built on the same underlying bag design by the same team. The flexible form factor is the basis for the other variants.',
  /** company category — a cold-chain technology company (not a bag maker, and not only a healthcare company) */
  category: 'Smart cold-chain and temperature-controlled transportation technology',
  /** what the current products are for */
  currentFocus: 'Diagnostic sample transportation',
  tagline: BRAND.tagline,
}

export type IndustryScope = 'current' | 'potential'

/**
 * Industries the company's technology is intended to serve (owner, positioning correction). `current`: INFINOS products
 * are developed for it today. `potential`: an application area of the technology for which the current products have
 * not been validated. Promote an industry to `current` only on the owner's confirmation.
 */
export const INDUSTRIES: { id: string; name: string; detail: string; scope: IndustryScope }[] = [
  { id: 'healthcare', name: 'Healthcare & diagnostics', detail: 'Diagnostic samples and other temperature-sensitive healthcare materials.', scope: 'current' },
  { id: 'pharma', name: 'Pharmaceuticals', detail: 'Temperature-sensitive medicines and pharmaceutical products.', scope: 'potential' },
  { id: 'food', name: 'Food & beverages', detail: 'Chilled and temperature-sensitive food and drink.', scope: 'potential' },
  { id: 'perishables', name: 'Perishable goods', detail: 'Fresh products that spoil outside their temperature range.', scope: 'potential' },
  { id: 'logistics', name: 'Specialised logistics', detail: 'Other temperature-sensitive products and specialised transport.', scope: 'potential' },
]

export const INDUSTRY_SCOPE: Record<IndustryScope, string> = {
  current: 'Current products',
  potential: 'Potential application',
}

/** headings of the two groups in the industries composition (PositioningSection) */
export const INDUSTRY_GROUP: Record<IndustryScope, string> = {
  current: 'Current products',
  potential: 'Potential applications',
}

export const INDUSTRY_NOTE =
  'Current INFINOS products are developed for diagnostic sample transportation. The other industries are potential applications of INFINOS technology; the current products have not been validated for them.'

/**
 * The three central ideas of the INFINOS product story — the current, diagnostic system. Chapters (story.ts `act`) and
 * supporting sections are organised around them.
 */
export const PILLARS = [
  {
    id: 'transport',
    numeral: 'I',
    title: 'Smart diagnostic transportation',
    detail: 'Portable sample collection and transport, designed around organised compartments and a two-zone temperature concept — from the patient’s home to the laboratory or hospital.',
    href: '#applications',
  },
  {
    id: 'technology',
    numeral: 'II',
    title: 'Intelligent cold-chain technology',
    detail: 'PCM-based thermal management, sensors, a monitoring application and chain-of-custody functionality.',
    href: '#technology',
  },
  {
    id: 'impact',
    numeral: 'III',
    /** deck p.04 "Social & Environmental Impact" (positioning correction: not "Healthcare impact") */
    title: 'Social & environmental impact',
    detail: 'Sample integrity, sustainable transportation and better access to diagnostic sample collection.',
    href: '#impact',
  },
] as const

/** temperature zones — a product concept (final content); Zone 1 is the upper chamber (accuracy pass) */
export const ZONES = {
  zone1: { name: 'Zone 1', chamber: 'Upper chamber', temp: '2–8 °C', prefix: '≈', status: 'designed' as Status, colour: '#9ccfff' },
  zone2: { name: 'Zone 2', chamber: 'Lower chamber', temp: '−10 °C', prefix: 'e.g.', status: 'example' as Status, colour: '#6b95ff' },
  /** accuracy pass: simultaneous dual-zone operation is not yet confirmed */
  simultaneous: 'planned' as Status,
  /** deck p.03 */
  sampleCategories: ['blood', 'urine', 'stool'],
}

/** coolant: PCM-based approach (final content); bottle details from deck p.08 — no duration / performance published */
export const COOLANT = {
  volume: '450 ml',
  form: 'Pre-filled coolant bottle',
  type: 'Organic or chemical phase-change material (PCM)',
  /** final content: duration and temperature-maintenance performance are published only after test results */
  durationNote: 'Cooling-duration figures will be published once testing is complete.',
}

export interface Feature {
  id: string
  label: string
  detail: string
  status: Status
  source: string
}

/** product features, grouped by theme */
export const FEATURES: Record<'temperature' | 'monitoring' | 'physical' | 'safety' | 'sustainability', Feature[]> = {
  temperature: [
    { id: 'zones', label: 'Two-zone temperature concept', detail: 'Zone 1 (upper chamber) at about 2–8 °C and Zone 2 at an example −10 °C; simultaneous operation is not yet confirmed.', status: 'designed', source: 'final content; accuracy pass; deck p.08' },
    { id: 'pcm', label: 'PCM-based thermal management', detail: 'A pre-filled 450 ml bottle of organic or chemical phase-change coolant.', status: 'available', source: 'final content; deck p.05, p.08' },
  ],
  monitoring: [
    { id: 'sensors', label: 'Sensors', detail: 'Sensors in the INFINOS containers.', status: 'available', source: 'final content; accuracy pass' },
    { id: 'app', label: 'Monitoring application', detail: 'The INFINOS monitoring application.', status: 'available', source: 'final content' },
    { id: 'custody', label: 'Chain-of-custody functionality', detail: 'Chain-of-custody functionality for sample handovers.', status: 'available', source: 'final content' },
  ],
  physical: [
    { id: 'portable', label: 'Portable container', detail: 'Carried between homes, laboratories and hospitals.', status: 'available', source: 'deck p.08 · photographs' },
    { id: 'compartments', label: 'Organised compartments', detail: 'Distinct sub-compartments for different sample categories.', status: 'available', source: 'final content · photographs' },
    { id: 'dualCompartment', label: 'Dual-compartment configuration', detail: 'An upper and a lower compartment in one carried bag (Pro Dual-Chamber Bag).', status: 'available', source: 'final content · photographs' },
  ],
  safety: [
    { id: 'tamper', label: 'Tamper-related functionality', detail: 'Functionality that addresses tampering.', status: 'available', source: 'final content' },
    { id: 'custody', label: 'Chain-of-custody functionality', detail: 'Chain-of-custody functionality for sample handovers.', status: 'available', source: 'final content' },
    { id: 'sensors', label: 'Sensors & monitoring application', detail: 'Sensors, used with the INFINOS monitoring application.', status: 'available', source: 'final content' },
    { id: 'innerBox', label: 'Zipped, removable inner box', detail: 'A separate inner box with its own zipped lid.', status: 'available', source: 'photographs' },
  ],
  sustainability: [
    { id: 'organic', label: 'Organic coolant options', detail: 'Reusable organic or chemical PCM coolant as an alternative to single-use ice packs.', status: 'designed', source: 'deck p.03, p.04, p.05' },
  ],
}

/**
 * Figures from INFINOS planning material. `publish: false` keeps a figure off the site: the final content allows
 * cooling and temperature-maintenance performance only once supporting test results exist; the contamination figure
 * stays unpublished until supporting test evidence exists (accuracy pass).
 */
export const FIGURES = {
  /** accuracy pass: the 35% refers to CONTAMINATION; unpublished until supporting test evidence exists */
  contamination: { value: 'Up to 35%', label: 'lower contamination rates', status: 'reported' as Status, publish: false, source: 'deck p.03; accuracy pass' },
  /** a projection at scale, not an achieved result (accuracy pass) */
  plastic: { value: '~500 t', label: 'projected plastic waste avoided per year', status: 'projected' as Status, publish: true, source: 'deck p.04; accuracy pass' },
  cooling: { value: '6+ h', label: 'cooling, volume-dependent', status: 'reported' as Status, publish: false, source: 'deck p.05' },
}

export interface RangeItem {
  id: string
  name: string
  role: string
  summary: string
  points: string[]
  status: Status
  visual: 'render' | 'flexible' | 'sensorial'
}

/**
 * Three variants of one product family (accuracy pass): same underlying bag design and team; the flexible form factor
 * is the basis for the other variants. Data logging is associated with the Flexible Container only; the Sensorial
 * Smart Container's specific capabilities are not yet established, so its description stays general.
 */
export const RANGE: RangeItem[] = [
  {
    id: 'flexible',
    name: 'Smart Diagnostics Flexible Container',
    role: 'Product variant · the base form factor',
    summary: 'The flexible form factor at the heart of the family, and the basis for the other INFINOS variants.',
    points: ['Flexible form factor', 'Data logging', 'Basis for the other INFINOS variants'],
    status: 'available',
    visual: 'flexible',
  },
  {
    id: 'pro',
    name: 'INFINOS Pro Dual-Chamber Bag',
    role: 'Product variant · shown above in 3D',
    summary: 'A dual-compartment bag configuration for organised sample transportation, built on the flexible form factor.',
    points: ['Dual-compartment bag configuration', 'Zone 1 in the upper chamber', 'Organised sub-compartments and a removable inner box', 'PCM-based thermal management'],
    status: 'available',
    visual: 'render',
  },
  {
    id: 'sensorial',
    name: 'Sensorial Smart Container',
    role: 'Product variant',
    summary: 'A further variant within the INFINOS family, built on the flexible form factor.',
    points: ['Specific capabilities to be announced'],
    status: 'designed',
    visual: 'sensorial',
  },
]

export const RANGE_NOTE = 'Specifications and configurations differ by variant; details are available on request.'

/** applications (deck p.02 market drivers, p.03, p.04, p.08 "home to lab/hospital"; final content: healthcare materials) */
export const APPLICATIONS = [
  { id: 'labs', name: 'Diagnostic laboratories', detail: 'Collection-to-laboratory transport, with different sample categories kept in organised compartments.' },
  { id: 'hospitals', name: 'Hospitals', detail: 'Sample collection and transfer for hospital laboratories and home-care teams.' },
  { id: 'home', name: 'Home sample collection', detail: 'Pick-up at the patient’s home, carried to the laboratory or hospital.' },
  { id: 'pathology', name: 'Pathology sample transport', detail: 'Routes across pathology and collection-centre networks.' },
  { id: 'remote', name: 'Remote & underserved regions', detail: 'Diagnostic collection where cold-chain infrastructure is thin.' },
]

/** final content: "other temperature-sensitive healthcare materials"; deck p.05 / p.03 for the examples */
export const OTHER_USES = 'Beyond diagnostic samples, INFINOS solutions are designed to support other temperature-sensitive healthcare materials, such as vaccines and pharmaceuticals.'

/** deck p.04 "Social & Environmental Impact" (aims; no unpublished performance figures) */
export const IMPACT = [
  { id: 'integrity', title: 'Sample integrity', detail: 'Organised transport with sensors and chain-of-custody functionality, designed to help protect sample integrity from collection to analysis.' },
  { id: 'icepacks', title: 'An alternative to single-use ice packs', detail: 'Reusable organic or chemical PCM coolant in place of disposable ice packs.' },
  { id: 'plastic', title: 'Sustainable transportation', detail: 'Aims to reduce the disposable cold packs moving through collection networks.', figure: 'plastic' as const },
  { id: 'access', title: 'Accessible diagnostic collection', detail: 'Sample collection that reaches remote and underserved regions.' },
]

/** UN Sustainable Development Goals named on deck p.04 (official goal titles) */
export const SDGS = [
  { n: 3, title: 'Good Health and Well-being' },
  { n: 9, title: 'Industry, Innovation and Infrastructure' },
  { n: 12, title: 'Responsible Consumption and Production' },
]
