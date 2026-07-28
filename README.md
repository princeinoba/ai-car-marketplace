# DriveLens Market Lab

DriveLens Market Lab is a privacy-first, AI-assisted Canadian vehicle-discovery portfolio demonstration. It preserves the strongest ideas from the uploaded AI car marketplace—inventory discovery, saved vehicles, comparison, finance planning, test-drive preparation, AI-assisted matching, and administrative information architecture—without pretending that a live dealership, lender, reservation system, or customer account exists.

## Product boundary

DriveLens is fictional. Vehicle makes, models, prices, mileage, inspection scores, branches, finance examples, test-drive plans, and administrative records are demonstration data.

The application does **not**:

- sell or reserve a vehicle;
- accept payment, deposits, financing applications, credit data, identity documents, or driver’s-licence details;
- create an account or server-side customer profile;
- create a real test-drive appointment;
- verify a VIN, title, lien, recall, inspection, seller, or vehicle history;
- store uploaded photos;
- infer exact year, price, mileage, ownership, VIN, or mechanical condition from an image.

## Product journeys

### Customer experience

```text
Understand the demonstration
→ browse twelve fictional Canadian vehicles
→ search, filter and sort
→ inspect a durable vehicle detail page
→ save or compare privately
→ use explainable Smart Match
→ model an educational finance scenario
→ create a browser-local test-drive reminder
```

### Optional photo match

```text
Select JPEG/PNG/WebP under 4 MB
→ same-origin Vercel Function validates it
→ configured Gemini model analyses visible attributes only
→ DriveLens returns up to three catalogue similarities
→ image is not stored by DriveLens
```

### Administration concept

```text
Review synthetic inventory
→ change fictional availability locally
→ review browser-local test-drive plans
→ edit a fictional local branch notice
→ reset demo state
```

## Architecture

```text
Vercel CDN
├── 28 generated routes
├── local CSS, JavaScript and original illustrations
├── browser-local saved, compare, reservation and admin state
├── PWA manifest and service worker
└── Vercel Functions
    ├── GET /api/health
    ├── GET /api/cars
    └── POST /api/ai/vehicle-match (optional GEMINI_API_KEY)
```

The base product has zero external npm dependencies and works when Gemini is not configured.

## Source layout

```text
api/                    Thin Vercel Function entry points
src/content/            Fictional marketplace catalogue
src/lib/                Pure catalogue, finance and state rules
src/server/             Read-only API and bounded photo-analysis handlers
src/templates/          Static document templates
src/static/             Browser modules, styles, icons, PWA files
scripts/                Build, local server and release verification
 tests/                  Node test suite
 docs/                   Audit, architecture and release evidence
```

## Requirements

- Node.js 24.x for Production.
- npm 10+.
- No database or authentication service.
- Optional `GEMINI_API_KEY` for photo matching.

## Commands

```bash
npm ci --ignore-scripts
npm run dev
npm run lint
npm test
npm run build
npm run smoke
npm run verify
```

`npm run verify` is the release gate. It runs syntax and policy checks, tests, a production build, document/asset/security verification, a high-confidence secret scan, HTTP smoke checks, and deterministic-build comparison.

## Environment variables

Create a local environment file only when testing optional photo matching. Never commit it.

```text
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
SITE_URL=
DRIVELENS_PUBLIC_INDEXING=false
```

- `GEMINI_API_KEY` must be server-only and Sensitive in Vercel.
- `GEMINI_MODEL` is optional; the stable default is `gemini-2.5-flash`.
- `SITE_URL` should be set only to an approved stable Production domain.
- Search indexing requires both `DRIVELENS_PUBLIC_INDEXING=true` and a stable Production origin.

## Content updates

Edit `src/content/catalog.mjs`, update matching local artwork under `src/static/assets/images/vehicles/`, and run `npm run verify`.

Vehicle records must remain fictional and must not contain real VINs, owner details, contact information, payment instructions, or unsupported safety/inspection claims.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md).

Recommended Vercel settings:

```text
Framework preset: Other
Node.js: 24.x
Install: npm ci --ignore-scripts
Build: npm run build
Output: dist
Production branch: main
```

## Provenance

The uploaded archive was based on a third-party tutorial repository and carried its Git history. The active implementation is a clean-room replacement. See [NOTICE.md](./NOTICE.md) and [docs/audit-report.md](./docs/audit-report.md).
