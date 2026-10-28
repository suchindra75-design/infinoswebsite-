# Launch checklist

Items to resolve before the new INFINOS website goes live. `npm run launch-check` reads the content files and fails
while any blocker remains.

## Blockers

None.

## Resolved

| # | Item | Resolution (2026-10-16) |
|---|---|---|
| R2 | **Exact registered company name** (formerly blocker B2) | Confirmed by the owner: **INFINOSTECH PRIVATE LIMITED**. Shown exactly so in the Company section and the footer (`legalName` in `src/content/company.ts`). The brand stays INFINOS / INFINOS Tech. The former LLP name appears nowhere in the project's current files; `npm run launch-check` fails if the LLP designation reappears in `src/`. No CIN, registered office or GSTIN is shown (none supplied). |
| R1 | **Photo publication consent** (formerly blocker B1) | The public gallery shows only two crops without identifiable people: the Cargomen demonstration cropped from chest height down (the two INFINOS bags, the hands holding them, the globe), and the Smart City Living Lab screen and device shelf, above everyone's head (both 5:3, re-cropped 2026-10-16). Product presentation and the group photograph are excluded: no safe crop exists. The four full photographs are **not in the website build** (removed from `public/images/gallery/`); their originals stay in `tools/assets/gallery/` for later. |

## Open items (not blocking)

| # | Item | Status |
|---|---|---|
| O1 | **VentureRISE recognition.** The statement "Selected among the Top 16 startups · VentureRISE Global Startup Challenge 2024/25 · ESDM category" is published from your description. The certificate itself has **not reached this session**. I searched every attachment in the conversation record (nested content included), the session's upload folder, and the Claude app's local storage around the upload time. The gallery request carried exactly seven images (four photographs, three old-site screenshots); an earlier message carried the INFINOS logo PNG. A failed or oversized attachment can drop silently, so this is not proof it was never sent. "View certificate" will be built and tested once the file arrives, e.g. by placing it in the project folder. | Waiting for the file |
| O2 | **Startup India**: shown as "Earlier registration" (historical claim). Current status for the Private Limited company to be verified. | Pending verification |
| O3 | **Amrita TBI**: shown as "Institutional support", subject to confirmation. Only the "amrita tbi" mark is shown; the old banner's "Funded by" wording is not. Confirm "supported" or "funded", and the period. | Pending confirmation |
| O4 | **DPIIT recognition**: not published (owner, 2026-10-15). It must be verified for the Private Limited company. The old logo contains the State Emblem of India, whose use is restricted. | Not published; pending verification |
| O5 | **Earlier collaborations** (Astromerge, Lunar Mission One, WH+, HelioX Cosmos): shown as "Earlier collaboration". Nature and dates optional. WH+ is shown only as "WH+" (owner). | As approved |
| O6 | **Low-resolution logos**: Amrita TBI (101 px original) and Agnii (139 px) look soft on high-density screens. Official logo files from those organisations would fix this. | Optional |
| O7 | Team, phone numbers, addresses, LinkedIn and the other migration items | See `docs/MIGRATION_COMPANY_INFO.md` |
| O8 | The previous website's leftover template pages (fake contact details) | Remove from the old host if it stays online |
| O9 | **Consent for the full photographs**, if you want them published later: Cargomen demonstration (five people), product presentation (presenter, team, visitors), Smart City Living Lab (participants, visitors), group photograph (fourteen people). With consent, re-encode them and list them in `src/content/gallery.ts` with `consent: 'confirmed'`. | Not published |
