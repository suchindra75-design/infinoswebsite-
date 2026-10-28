import { COOLANT, FEATURES, FIGURES, STATUS_TAG, ZONES, type Status } from '@/content/platform'
import type { FigureId } from '@/content/story'

/**
 * Information graphics for features that are described in the INFINOS material but are not visible on the physical
 * product (coolant, sensorised compartments, safety, monitoring). They explain; they never add hardware to the model.
 * One restrained line style: 1 px hairlines, the two zone colours (tokens: they deepen on the lit studio), mono labels.
 */

export function StatusTag({ status, children }: { status: Status; children?: React.ReactNode }) {
  const text = children ?? STATUS_TAG[status]
  if (!text) return null
  return <span className={`fx-tag fx-tag--${status}`}>{text}</span>
}

export function CoolantFigure() {
  return (
    <figure className="fx fx-coolant">
      <svg viewBox="0 0 64 104" className="fx-coolant-glyph" aria-hidden="true">
        <defs>
          <linearGradient id="fxCool" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={ZONES.zone1.colour} stopOpacity="0.08" />
            <stop offset="1" stopColor={ZONES.zone1.colour} stopOpacity="0.32" />
          </linearGradient>
        </defs>
        <rect x="22" y="2" width="20" height="9" rx="2" className="fx-line" />
        <rect x="6" y="11" width="52" height="90" rx="9" className="fx-line" fill="url(#fxCool)" />
        <path d="M18 34 H46 M18 56 H46 M18 78 H46" className="fx-line fx-line--faint" />
        <rect x="24" y="40" width="16" height="10" rx="2" className="fx-line fx-line--faint" />
      </svg>
      <figcaption>
        <span className="fx-big">{COOLANT.volume}</span>
        <span className="fx-cap">{COOLANT.form}</span>
        <span className="fx-cap fx-cap--dim">PCM · organic or chemical</span>
      </figcaption>
    </figure>
  )
}

export function CompartmentFigure({ large = false }: { large?: boolean }) {
  return (
    <figure className={`fx fx-compartments ${large ? 'fx--large' : ''}`}>
      <svg viewBox="0 0 220 150" aria-hidden="true">
        {/* body */}
        <rect x="4" y="4" width="160" height="142" rx="8" className="fx-line" />
        {/* zone 1: upper chamber */}
        <rect x="12" y="12" width="144" height="58" rx="4" style={{ fill: 'var(--zone1)', stroke: 'var(--zone1)' }} fillOpacity="0.1" strokeOpacity="0.55" />
        <path d="M60 18 V64 M108 18 V64" className="fx-line fx-line--faint" />
        {/* zone 2: lower chamber */}
        <rect x="12" y="80" width="144" height="58" rx="4" style={{ fill: 'var(--zone2)', stroke: 'var(--zone2)' }} fillOpacity="0.12" strokeOpacity="0.6" />
        <path d="M84 86 V132" className="fx-line fx-line--faint" />
        {/* illustrative sensor points and the monitoring application (no positions or counts are specified) */}
        {[[36, 41], [84, 41], [132, 41], [48, 109], [120, 109]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" className="fx-sensor" />
        ))}
        <path d="M132 41 H176 M120 109 H176 M176 41 V109 M176 75 H188" className="fx-line fx-line--dash" />
        <rect x="188" y="66" width="26" height="18" rx="3" className="fx-line" />
        <text x="201" y="78" className="fx-svg-label" textAnchor="middle">APP</text>
      </svg>
      <figcaption className="fx-legend">
        <span><i style={{ background: 'var(--zone1)' }} />{ZONES.zone1.name} · {ZONES.zone1.chamber.toLowerCase()} · {ZONES.zone1.prefix} {ZONES.zone1.temp}</span>
        <span><i style={{ background: 'var(--zone2)' }} />{ZONES.zone2.name} · {ZONES.zone2.chamber.toLowerCase()} · {ZONES.zone2.prefix} {ZONES.zone2.temp}</span>
        <span><i className="fx-legend-sensor" />Sensor point · illustrative</span>
      </figcaption>
    </figure>
  )
}

const SAFETY_ICONS: Record<string, React.ReactNode> = {
  tamper: <><rect x="4" y="9" width="12" height="9" rx="1.5" /><path d="M7 9V6.5a3 3 0 0 1 6 0V9" /></>,
  custody: <><rect x="2" y="7" width="8" height="6" rx="3" /><rect x="10" y="7" width="8" height="6" rx="3" /></>,
  sensors: <><circle cx="10" cy="10" r="2.2" /><path d="M5.8 5.8a6 6 0 0 0 0 8.4M14.2 5.8a6 6 0 0 1 0 8.4M3.3 3.3a9.5 9.5 0 0 0 0 13.4M16.7 3.3a9.5 9.5 0 0 1 0 13.4" /></>,
  innerBox: <><rect x="3" y="7" width="14" height="10" rx="1.5" /><path d="M3 7l2-3h10l2 3M8 10h4" /></>,
}

export function SafetyFigure() {
  return (
    <ul className="fx fx-list" aria-label="Safety features">
      {FEATURES.safety.map((f) => (
        <li key={f.id}>
          <svg viewBox="0 0 20 20" className="fx-icon" aria-hidden="true">{SAFETY_ICONS[f.id]}</svg>
          <span className="fx-list-label">{f.label}</span>
          <StatusTag status={f.status} />
        </li>
      ))}
    </ul>
  )
}

export function SustainFigure() {
  const f = FIGURES.plastic
  return (
    <figure className="fx fx-sustain">
      <div className="fx-sustain-row" aria-hidden="true">
        <svg viewBox="0 0 44 44" className="fx-glyph">
          <rect x="9" y="6" width="26" height="32" rx="5" className="fx-line fx-line--faint" />
          <path d="M15 16h14M15 22h14M15 28h14" className="fx-line fx-line--faint" />
          <path d="M5 40L39 4" className="fx-line" />
        </svg>
        <span className="fx-arrow" />
        <svg viewBox="0 0 44 44" className="fx-glyph">
          <rect x="13" y="9" width="18" height="28" rx="4" className="fx-line" fill={ZONES.zone1.colour} fillOpacity="0.18" />
          <rect x="17" y="5" width="10" height="4" rx="1" className="fx-line" />
          <path d="M6 22a16 16 0 0 1 4.5-11.2M38 22a16 16 0 0 1-4.5 11.2" className="fx-line fx-line--faint" />
          <path d="M8.6 8.4l2 2.6-3.2.6M35.4 35.6l-2-2.6 3.2-.6" className="fx-line fx-line--faint" />
        </svg>
        <span className="fx-cap">Single-use ice packs → reusable PCM coolant</span>
      </div>
      <figcaption className="fx-stat">
        <span className="fx-big">{f.value}</span>
        <span className="fx-cap">{f.label}</span>
        <StatusTag status={f.status} />
      </figcaption>
    </figure>
  )
}

/** a representation of the INFINOS monitoring application — illustrative, not a screenshot of the app */
export function MonitorFigure({ large = false }: { large?: boolean }) {
  // zone rows show the configured ranges only — no live traces, so nothing suggests simultaneous two-zone operation
  const rows = [ZONES.zone1, ZONES.zone2]
  return (
    <figure className={`fx fx-monitor ${large ? 'fx--large' : ''}`}>
      <div className="fx-monitor-head">
        <span>INFINOS · Monitor</span>
        <span className="fx-tag">Illustrative interface</span>
      </div>
      {rows.map((z) => (
        <div className="fx-monitor-row" key={z.name}>
          <i style={{ background: z.colour }} />
          <span className="fx-monitor-zone">{z.name}</span>
          <span className="fx-monitor-range">{z.chamber}</span>
          <span className="fx-monitor-target">{z.prefix} {z.temp}</span>
        </div>
      ))}
      <div className="fx-monitor-row fx-monitor-row--meta">
        <span>Sensors</span>
        <span>Monitoring</span>
        <span>Chain of custody</span>
      </div>
    </figure>
  )
}

export function StoryFigure({ id }: { id: FigureId }) {
  switch (id) {
    case 'coolant':
      return <CoolantFigure />
    case 'compartments':
      return <CompartmentFigure />
    case 'safety':
      return <SafetyFigure />
    case 'sustain':
      return <SustainFigure />
    case 'monitor':
      return <MonitorFigure />
  }
}
