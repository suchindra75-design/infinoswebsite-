import type { Vec3 } from '@/motion/sequences'
import { COOLANT, POSITIONING } from '@/content/platform'

/**
 * The product story — one idea per chapter, on the same scroll progress as the product (ranges: chapters.ts
 * STORY_RANGES). Product facts come from src/content/platform.ts (the pitch deck, with page references and status);
 * physical details from the 13 product photographs. Features whose implementation is not confirmed are worded as part
 * of the design, or marked "in development" where the deck itself says so.
 */
export interface Callout {
  label: string
  /** product layer the point belongs to (products.ts MODEL_COMPONENTS id) and the point in model space (glTF metres) */
  component: string
  point: Vec3
  /** visible between these global progress values (eased in and out at the edges) */
  window: [number, number]
  /** label on this side of the point */
  side: 'left' | 'right'
  /** shown on phones too (phones show one callout at a time, with the short label) */
  phone?: boolean
  short?: string
}

/** a temperature-zone bracket drawn along a chamber of the real product (two model-space points, projected) */
export interface ZoneMark {
  zone: 'zone1' | 'zone2'
  component: string
  top: Vec3
  bottom: Vec3
  window: [number, number]
}

export type FigureId = 'coolant' | 'compartments' | 'safety' | 'sustain' | 'monitor'

export interface StoryChapter {
  id: string
  index: string
  /** which of the three central ideas (platform.ts PILLARS) the chapter belongs to; 0 = all three */
  act: 0 | 1 | 2 | 3
  name: string
  headline: string
  body: string
  note?: string
  /** small "shown:" line under the body */
  shown?: string
  /** the text starts to appear at this global progress (default: the chapter start) — after a composition move */
  enter?: number
  figure?: FigureId
  callouts: Callout[]
  zones?: ZoneMark[]
  cta?: boolean
}

// chamber edge used for the zone brackets: the back-right vertical edge — the bag's right-hand silhouette in the
// exterior pass and side views — just outside the bag, so the labels sit in free space beside the product
const EDGE_X = 0.25
const EDGE_Z = -0.2

export const STORY: StoryChapter[] = [
  {
    id: 'overview',
    act: 1,
    index: '01',
    // positioning correction: the company is cold-chain technology; the product shown is its current, diagnostic one
    name: 'Smart cold chain',
    headline: 'The cold chain, made smart.',
    body: 'Smart, temperature-controlled transportation. Today’s INFINOS products are designed for diagnostic samples: organised compartments and PCM-based thermal management, from homes to laboratories and hospitals.',
    shown: `Shown: ${POSITIONING.physical}`,
    callouts: [],
  },
  {
    id: 'architecture',
    act: 1,
    index: '02',
    name: 'Dual-temperature architecture',
    headline: 'Two temperature zones, by design.',
    body: 'The INFINOS concept separates two temperature zones for different sample categories, such as blood, urine and stool: Zone 1 in the upper chamber at about 2–8 °C, Zone 2 at an example −10 °C.',
    note: 'Simultaneous operation of both zones is not yet confirmed and awaits validation.',
    callouts: [],
    zones: [
      { zone: 'zone1', component: 'upper', top: [EDGE_X, 0.462, EDGE_Z], bottom: [EDGE_X, 0.272, EDGE_Z], window: [0.247, 0.297] },
      { zone: 'zone2', component: 'lower', top: [EDGE_X, 0.232, EDGE_Z], bottom: [EDGE_X, 0.03, EDGE_Z], window: [0.247, 0.297] },
    ],
  },
  {
    id: 'cooling',
    act: 2,
    index: '03',
    name: 'PCM thermal management',
    headline: 'Cold, prepared in advance.',
    body: `INFINOS uses PCM-based thermal management: a pre-filled ${COOLANT.volume} bottle of organic or chemical phase-change material (PCM) coolant, prepared before collection.`,
    note: COOLANT.durationNote,
    enter: 0.352,
    figure: 'coolant',
    callouts: [
      { label: 'Zone 1 · upper chamber', short: 'Zone 1', component: 'upper', point: [0, 0.4, 0.06], window: [0.355, 0.391], side: 'right', phone: true },
    ],
  },
  {
    id: 'compartments',
    act: 2,
    index: '04',
    name: 'Intelligent compartments',
    headline: 'A place for every sample.',
    body: 'Organised sub-compartments keep sample categories apart: Zone 1 in the upper chamber, Zone 2 in the lower chamber, and a removable inner box.',
    note: 'Sensor points in the illustration are indicative only.',
    figure: 'compartments',
    callouts: [
      { label: 'Zone 1 · upper chamber', short: 'Zone 1', component: 'upper', point: [0, 0.4, 0.06], window: [0.398, 0.442], side: 'right', phone: true },
      { label: 'Zone 2 · lower chamber', short: 'Zone 2', component: 'lower', point: [0, 0.12, 0.15], window: [0.432, 0.47], side: 'right', phone: true },
      { label: 'Removable inner box', short: 'Inner box', component: 'innerBox', point: [0, 0.11, 0.2], window: [0.476, 0.516], side: 'right', phone: true },
    ],
  },
  {
    id: 'monitoring',
    act: 2,
    index: '05',
    name: 'Smart monitoring & chain of custody',
    headline: 'Every handover, accounted for.',
    body: 'INFINOS combines sensors and a monitoring application, with chain-of-custody functionality for sample handovers.',
    note: 'Data logging is part of the Smart Diagnostics Flexible Container.',
    figure: 'monitor',
    callouts: [
      { label: 'Reflective lining', short: 'Reflective lining', component: 'innerBoxLid', point: [0, 0.22, 0.05], window: [0.548, 0.612], side: 'right', phone: true },
      { label: 'Sample rack · 12 × (3 + 4)', component: 'rack', point: [-0.04, 0.07, 0.03], window: [0.575, 0.616], side: 'right' },
    ],
  },
  {
    id: 'sustainability',
    act: 3,
    index: '06',
    name: 'Sustainable cold chain',
    headline: 'Reusable cold. Less waste.',
    body: 'Reusable PCM coolant is designed to replace single-use ice packs and reduce the plastic that collection networks discard.',
    figure: 'sustain',
    callouts: [],
  },
  {
    id: 'safety',
    act: 3,
    index: '07',
    name: 'Safety & sample integrity',
    headline: 'Built for sample integrity.',
    body: 'Tamper-related and chain-of-custody functionality are designed to support sample integrity, from collection to analysis.',
    enter: 0.722,
    figure: 'safety',
    callouts: [
      { label: 'On-board display', short: 'Display', component: 'display', point: [0.2265, 0.31, 0.006], window: [0.752, 0.826], side: 'right', phone: true },
    ],
  },
  {
    id: 'system',
    act: 0,
    index: '08',
    name: 'The complete INFINOS system',
    headline: 'From doorstep to laboratory.',
    body: 'Smart diagnostic transportation, intelligent cold-chain technology and social and environmental impact — one INFINOS system, from collection to analysis.',
    callouts: [],
    cta: true,
  },
]
