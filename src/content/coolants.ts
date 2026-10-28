/**
 * Coolant showcase content — the ONE place where coolant information lives (owner briefs, 2026-10-13/15).
 *
 * Colour mapping (brief, "do not reverse"): Organic = blue / turquoise (the blue pack in coolents.pdf),
 * Inorganic = white (the white pack in coolents.pdf), Eutectic = very light beige.
 *
 * All three are shown with the pack photographed in coolents.pdf (model: public/models/coolant-pack.glb, generator:
 * tools/build_coolant_pack.py). `liquid` is the filled body, `headspace` the unfilled plastic above the fill line —
 * both photographs show that lighter band under the shoulders. `ui` is the same colour for the labels, hover and
 * selected states, so the selector always matches the model.
 *
 * TECHNICAL INFORMATION — publication rule
 *   Only fields with `status: 'verified'` are ever rendered. A field becomes verified only when the owner provides or
 *   approves the value together with its source. Everything else stays `pending`: it is kept here so the open
 *   question is visible to editors, and it is never shown to visitors. Do not fill values from assumptions or
 *   general industry knowledge (owner, 2026-10-15).
 *
 *   Open questions (owner, 2026-10-15) — all unresolved, all kept out of public content:
 *     Q1  Is "Inorganic" the coolant the pitch deck calls "chemical"?
 *     Q2  Does the deck's "pre-filled 450 ml bottle" apply to these coolant packs (and to all three)?
 *     Q3  Does "PCM" (phase-change material) accurately describe all three variants?
 *     Q4  Does the Eutectic pack use the same moulding as the other two?
 */
export type CoolantId = 'organic' | 'inorganic' | 'eutectic'

/** the information fields a coolant may have, in display order; labels are the visible row titles */
export const COOLANT_FIELDS = {
  type: 'Coolant type',
  composition: 'Composition',
  physical: 'Physical characteristics',
  application: 'Intended application',
  operatingRange: 'Operating temperature range',
  phaseChange: 'Phase change',
  reusability: 'Reusability',
  storage: 'Storage and conditioning',
  compatibility: 'Compatibility with INFINOS containers',
} as const
export type CoolantFieldId = keyof typeof COOLANT_FIELDS

export interface CoolantField {
  /** the visible value — fill only when verified */
  value: string
  status: 'verified' | 'pending'
  /** where the verified value comes from (document, page, date) — required for verified fields */
  source?: string
  /** editor note: what is open, which question it waits on */
  note?: string
}

export interface Coolant {
  id: CoolantId
  name: string
  liquid: string
  headspace: string
  ui: string
  /** technical information; a field that is absent or not verified is not shown */
  fields: Partial<Record<CoolantFieldId, CoolantField>>
}

/** the pending fields every variant shares today, with the open questions they wait on */
const pendingFields = (): Coolant['fields'] => ({
  type: { value: '', status: 'pending', note: 'Awaiting owner: classification of this variant; Q1 (Inorganic vs "chemical") and Q3 (PCM) unresolved.' },
  composition: { value: '', status: 'pending', note: 'Awaiting owner: composition, and whether it may be published.' },
  physical: { value: '', status: 'pending', note: 'Awaiting owner: dimensions, weight, fill volume. Q2 (450 ml) and Q4 (moulding) unresolved.' },
  application: { value: '', status: 'pending', note: 'Awaiting owner: intended samples / temperature zone / use cases.' },
  operatingRange: { value: '', status: 'pending', note: 'Awaiting owner: verified operating range with source.' },
  phaseChange: { value: '', status: 'pending', note: 'Awaiting owner: phase-change temperature, if applicable (Q3).' },
  reusability: { value: '', status: 'pending', note: 'Awaiting owner: reusability and its basis (e.g. tested cycles).' },
  storage: { value: '', status: 'pending', note: 'Awaiting owner: pre-conditioning temperature and time.' },
  compatibility: { value: '', status: 'pending', note: 'Awaiting owner: which INFINOS containers / chambers.' },
})

/** listed in the brief's order; they also enter the scene in this order (back / left of the fan first) */
export const COOLANTS: Coolant[] = [
  { id: 'organic', name: 'Organic', liquid: '#5ebfc6', headspace: '#d6e9e8', ui: '#6cc8ce', fields: pendingFields() },
  { id: 'inorganic', name: 'Inorganic', liquid: '#eceee9', headspace: '#dfe5e6', ui: '#eef0ec', fields: pendingFields() },
  { id: 'eutectic', name: 'Eutectic', liquid: '#e9e0d0', headspace: '#e6e3dc', ui: '#e6d8c2', fields: pendingFields() },
]

/** the visible rows for a coolant: verified fields only, in COOLANT_FIELDS order */
export function verifiedFields(c: Coolant): { id: CoolantFieldId; label: string; value: string }[] {
  return (Object.keys(COOLANT_FIELDS) as CoolantFieldId[])
    .filter((id) => c.fields[id]?.status === 'verified' && !!c.fields[id]?.value.trim())
    .map((id) => ({ id, label: COOLANT_FIELDS[id], value: c.fields[id]!.value }))
}

/**
 * family copy (owner, 2026-10-15); `memberLine` is the owner's statement that all three are one product family.
 * The headline names the family, not a shared moulding: whether the Eutectic pack uses the same moulding is
 * unconfirmed (Q4), so no manufacturing claim (owner correction: not "One pack design.").
 */
export const COOLANT_FAMILY = {
  kicker: 'INFINOS coolants',
  headline: 'Three coolant variants. One INFINOS coolant family.',
  hint: 'Select a coolant',
  all: 'All coolants',
  variantKicker: 'Coolant variant',
  memberLine: 'Part of the INFINOS coolant family.',
  request: 'Request specifications',
  requestHref: '#contact',
} as const

/** the pack's cap, white in both photographs */
export const COOLANT_CAP = '#eef0ec'

/**
 * Still images for browsers without WebGL: the settled fan, and the fan with each variant pulled forward — rendered
 * from the real scene (tools: QA still capture), so the fallback follows the selection.
 */
export const COOLANT_STILLS: Record<CoolantId | 'family', string> = {
  family: '/images/coolants-fan.webp',
  organic: '/images/coolants-fan-organic.webp',
  inorganic: '/images/coolants-fan-inorganic.webp',
  eutectic: '/images/coolants-fan-eutectic.webp',
}
