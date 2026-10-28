// npm run launch-check — lists what must be resolved before the website goes live, and fails while any blocker
// remains. It reads the central content files only (no build needed). See docs/LAUNCH_CHECKLIST.md.
import { readFileSync, readdirSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const blockers = []
const open = []

// gallery photographs: publication consent for identifiable people (owner, 2026-10-15)
const gallery = read('src/content/gallery.ts')
for (const m of gallery.matchAll(/photo\('([^']+)'[\s\S]*?consent: '(pending|confirmed)'/g)) {
  if (m[2] === 'pending') blockers.push(`Gallery photo "${m[1]}": publication consent pending (it is hidden from visitors; its file is still in public/images/gallery/).`)
}

// VentureRISE certificate: the exact certificate file, for "View certificate"
if (/certificate:\s*null/.test(read('src/content/ecosystem.ts'))) open.push('VentureRISE certificate file not yet received in this project: the recognition statement is shown without "View certificate" (docs/LAUNCH_CHECKLIST.md O1).')

// legal name (migration item L1): confirmed by the owner (2026-10-16); the former LLP designation must not ship
const company = read('src/content/company.ts')
const legalName = company.match(/legalName: '([^']+)'/)?.[1]
if (!legalName || /await the owner's confirmation/.test(company)) blockers.push(`Exact registered company name not yet confirmed (shown: "${legalName}").`)
const llp = readdirSync(new URL('../src', import.meta.url), { recursive: true }).filter((f) => /\.(tsx?|css|json)$/.test(f) && /\bLLP\b/i.test(read(`src/${f}`)))
if (llp.length) blockers.push(`The former LLP designation appears in src/: ${llp.join(', ')}.`)

for (const b of blockers) console.log(`BLOCKER  ${b}`)
for (const o of open) console.log(`OPEN     ${o}`)
console.log(blockers.length ? `\n${blockers.length} launch blocker(s). See docs/LAUNCH_CHECKLIST.md.` : '\nNo launch blockers in the content files.')
process.exit(blockers.length ? 1 : 0)
