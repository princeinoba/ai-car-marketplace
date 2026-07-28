# Repository instructions

## Product boundary

DriveLens Market Lab is a fictional Canadian vehicle-discovery portfolio demonstration. Never present it as a live dealership, lender, financing service, reservation service, vehicle-history provider, inspection provider, marketplace, or identity-verification service.

## Non-negotiable architecture

- Keep the dependency-free static-generator architecture unless an approved product requirement proves a framework is necessary.
- Keep public catalogue, saved, compare, finance, test-drive planning, and admin demonstration connected to `src/content/catalog.mjs`.
- Keep all visitor state browser-local and scoped to `drivelens:*` keys.
- Keep `/api/health` and `/api/cars` read-only.
- Keep photo analysis optional, server-only, bounded, non-persistent, and limited to visible attributes.
- Never infer or claim VIN, ownership, exact year, price, mileage, mechanical condition, safety, title, lien, recall, or inspection from an image.
- Do not add accounts, database storage, payment, lender integration, real test-drive booking, uploads, analytics, advertising, or personal-data collection to this release.

## Source of truth

- Marketplace content: `src/content/catalog.mjs`
- Pure business rules: `src/lib/*.mjs`
- API contracts: `src/server/handlers.mjs`
- Page composition: `src/templates/*.mjs`
- Browser behaviour: `src/static/assets/*.js`
- Deployment contract: `vercel.json`
- Release gate: `npm run verify`

## Required verification

Before committing any source or tracked documentation change:

```bash
npm ci --ignore-scripts
npm audit --omit=dev
npm run verify
git diff --check
```

When UI changes, verify at 390×844, 768×1024, 1440×900 and 1536×1024. Check keyboard operation, focus, overflow, console errors, CSP violations, service-worker behaviour, and designed states.

## Budgets

```text
Complete dist:          ≤ 1,500,000 bytes
Browser JavaScript:     ≤ 120,000 bytes uncompressed
CSS:                    ≤ 70,000 bytes uncompressed
External npm packages:  0 unless explicitly approved
```

## Security and privacy

- Never commit `.env*`, `.vercel/`, `dist/`, `node_modules/`, ZIP archives, credentials, browser profiles, or uploaded photos.
- Never put `GEMINI_API_KEY` in browser code or a public-prefixed variable.
- Never print, log, screenshot, or return secret values.
- Never use `localStorage.clear()`.
- Escape browser-rendered user/provider text before assigning `innerHTML`; prefer `textContent`.
- Validate persisted IDs, versions, statuses, bounds, date/time formats and notes.
- Keep the service worker from caching `/api/`.
- Preserve restrictive CSP and security headers.

## Git and release

- Use feature branches and pull requests into `main`.
- Require exact-commit CI and Preview verification before merge.
- Do not force-push or bypass required checks.
- Production must be built from the merged `main` SHA.
- Initial Production remains publicly accessible but non-indexable until the owner explicitly approves indexing.

## No-invention rule

Do not fabricate real manufacturers, dealerships, customers, appointments, approvals, financing rates, lender relationships, inspection results, ownership records, awards, adoption metrics, or business outcomes.
