# DriveLens Market Lab architecture

Review date: 27 July 2026

## 1. Product classification

DriveLens Market Lab is a fictional, privacy-first, AI-assisted Canadian vehicle marketplace portfolio demonstration.

It is designed to demonstrate vehicle discovery and software architecture without operating as a dealership, lender, broker, reservation system, identity provider, or data marketplace.

```text
Capabilities included
├── fictional vehicle discovery
├── durable vehicle detail pages
├── private saved vehicles
├── private three-vehicle comparison
├── explainable Smart Match
├── educational finance planning
├── local test-drive planning
├── optional bounded photo matching
└── synthetic administration concept

Capabilities excluded
├── accounts
├── database
├── real inventory publishing
├── payments or deposits
├── financing applications
├── identity or licence collection
├── real test-drive booking
├── VIN/history verification
├── image storage
└── live administrative mutation
```

---

# 2. Current Vercel release architecture

```text
Vercel CDN
├── 28 generated route documents
├── local CSS, JavaScript, SVG and PNG assets
├── PWA manifest and service worker
├── browser-local state
│   ├── saved vehicles
│   ├── comparison selection
│   ├── test-drive reminders
│   ├── synthetic inventory status
│   └── local branch notice
└── Node.js Vercel Functions
    ├── GET /api/health
    ├── GET /api/cars
    └── POST /api/ai/vehicle-match
        └── optional Gemini visible-attribute analysis
```

## Why static-first

The base catalogue is bounded, fictional, and release-controlled. Generating complete documents provides:

- durable direct URLs;
- crawlable HTML even though indexing is currently disabled;
- no database dependency;
- small browser JavaScript;
- graceful operation when optional AI is unavailable;
- simple failure isolation;
- fast deployment and rollback;
- deterministic build verification.

The base product requires no secret and no Function invocation for ordinary browsing.

---

# 3. Source boundaries

```text
api/
  Thin Vercel Function entry points only.

src/content/
  Fictional vehicle, branch and marketplace source of truth.

src/lib/
  Pure catalogue, saved/compare, finance, reservation and admin rules.

src/server/
  Request validation, API response contracts and optional provider boundary.

src/templates/
  Complete HTML document generation and metadata.

src/static/
  Browser enhancement modules, design system, local imagery and PWA files.

scripts/
  Build, local server, policy checking, smoke testing and determinism.

tests/
  Domain, API and template tests.

docs/
  Audit, architecture, owner decisions, preflight and verification evidence.
```

No browser module imports a server secret. No server handler imports browser-local state.

---

# 4. Route architecture

## Public discovery

```text
/
/cars/
/cars/arden-nova-e/
/cars/kinetic-trail-x/
/cars/meridian-corsa/
/cars/northline-atlas/
/cars/solara-metro/
/cars/vanta-ridge/
/cars/aeropulse-gt/
/cars/everfield-voyage/
/cars/lucent-city/
/cars/terrapeak-cross/
/cars/ionix-stream/
/cars/redwood-touring/
/match/
/finance/
/safety/
/about/
/privacy/
```

## Browser-local tools

```text
/saved/
/compare/
/test-drive/
/reservations/
```

## Synthetic administration

```text
/admin/
/admin/inventory/
/admin/test-drives/
/admin/settings/
```

## Error and platform resources

```text
/404/
/site.webmanifest
/sw.js
/robots.txt
/sitemap.xml
/.well-known/security.txt
```

Public pages are `noindex,follow` for the initial portfolio release. Browser-local, Admin, and 404 routes are `noindex,nofollow`.

Indexing requires both:

```text
DRIVELENS_PUBLIC_INDEXING=true
stable Production origin
```

Production environment alone is not approval to index.

---

# 5. Catalogue model

Each fictional vehicle record contains:

```ts
interface Vehicle {
  id: string
  slug: string
  make: string
  model: string
  year: number
  trim: string
  price: number          // CAD demonstration price
  mileage: number        // kilometres
  colour: string
  bodyType: BodyType
  fuelType: FuelType
  transmission: Transmission
  drivetrain: Drivetrain
  seats: number
  status: VehicleStatus
  branchId: string
  image: string          // same-origin local artwork
  summary: string
  description: string
  features: string[]
  inspectionScore: number // fictional demonstration score
  featured: boolean
}
```

The source validates:

- unique IDs and slugs;
- bounded year, price, mileage, seats and score;
- explicit allowlists;
- valid branch references;
- same-origin images;
- no VIN, owner, phone, email, payment, or identity information;
- a visible fictional/demo classification.

---

# 6. Browser-local state architecture

## Keys

```text
drivelens:theme:v1
drivelens:saved:v1
drivelens:compare:v1
drivelens:reservations:v1
drivelens:admin:v1
```

## Saved vehicles

- allowlisted vehicle IDs only;
- deduplicated;
- malformed JSON normalizes safely;
- no server request;
- clear action affects only the DriveLens saved key.

## Comparison

- allowlisted vehicle IDs;
- maximum three vehicles;
- stable order;
- designed empty and one-item states;
- no claim of reservation or quote.

## Test-drive reminders

```ts
interface LocalTestDriveReminder {
  id: string
  version: 1
  vehicleId: string
  branchId: string
  date: string
  time: string
  notes: string
  status: "Planned" | "Completed" | "Cancelled"
  createdAt: string
  updatedAt: string
}
```

Rules:

- vehicle and branch allowlists;
- date cannot be in the past when created;
- supported appointment times only;
- bounded notes;
- no name, email, telephone, licence, address, or identity data;
- no network request;
- no claim that a dealership receives or confirms the plan.

## Synthetic admin state

```ts
interface AdminDemoState {
  version: 1
  vehicleStatusOverrides: Record<VehicleId, VehicleStatus>
  branchNotice: string
}
```

All changes remain on the current device and can be reset.

---

# 7. Finance architecture

The finance planner is a pure educational calculation.

Inputs:

```text
Vehicle price: CAD 1,000–250,000
Down payment: 0–price
Annual rate: 0–30%
Term: bounded supported months
```

Output:

- financed principal;
- monthly estimate;
- total paid;
- interest estimate;
- down-payment share.

It excludes:

- tax unless explicitly modelled;
- registration;
- insurance;
- warranty;
- trade-in;
- lender fees;
- credit decisions;
- lender approval;
- binding quote.

No finance input is transmitted or persisted.

---

# 8. Smart Match architecture

Smart Match is deterministic and explainable.

```text
User-stated needs
├── budget
├── body preference
├── fuel preference
├── passenger needs
├── driving context
└── feature priorities
        ↓
Pure scoring rules
        ↓
Top matches + explicit reasons
```

The scoring engine uses only source-controlled catalogue fields and user-selected needs. It does not claim personalization from behavioural profiling and does not use an external AI provider.

This ensures the primary matching experience is:

- available offline after initial load;
- testable;
- transparent;
- repeatable;
- free of provider quota/credential dependency.

---

# 9. Optional photo-match Function

## Request

```http
POST /api/ai/vehicle-match
Content-Type: application/json

{
  "dataUrl": "data:image/jpeg;base64,..."
}
```

## Validation

- method POST only;
- JSON body approximately 5.7 MB maximum;
- decoded image 256 bytes–4 MB;
- JPEG, PNG, or WebP only;
- strict data-URL syntax;
- twelve-second provider timeout;
- no persistence;
- no analytics.

## Provider prompt boundary

Allowed:

- broad make cue;
- body type;
- visible colour;
- visible exterior attributes;
- confidence;
- limitations.

Prohibited:

- VIN;
- ownership;
- exact year;
- mileage;
- price/value;
- title/lien;
- mechanical condition;
- safety;
- roadworthiness;
- accident history;
- identity of a person.

## Response

```ts
interface PhotoMatchResponse {
  analysis: {
    makeHint: string
    bodyType: string
    color: string
    visibleFeatures: string[]
    confidence: number
    limitations: string
  }
  matches: Array<{
    id: string
    slug: string
    make: string
    model: string
    bodyType: string
    price: number
    image: string
    reasons: string[]
  }>
  disclaimer: string
  requestId: string
}
```

The provider result is normalized before catalogue scoring. Raw provider responses are never returned or intentionally logged.

When `GEMINI_API_KEY` is absent, the route returns a bounded `503 ai_unconfigured` response and directs visitors to Smart Match.

---

# 10. API contracts

## `GET /api/health`

Returns product classification and capability flags only.

```json
{
  "status": "ok",
  "product": "DriveLens Market Lab",
  "classification": "fictional ... demonstration",
  "capabilities": {
    "liveSales": false,
    "accounts": false,
    "database": false,
    "payments": false,
    "financingApplications": false,
    "realReservations": false,
    "localSavedVehicles": true,
    "localCompare": true,
    "localTestDrivePlanning": true,
    "optionalPhotoAI": false,
    "readOnlyCatalogApi": true
  }
}
```

- `GET` only;
- `Cache-Control: no-store`;
- request ID;
- no secret or configuration values.

## `GET /api/cars`

Supported query parameters:

```text
q
bodyType
fuelType
status
maxPrice
minYear
sort
limit
```

- allowlisted catalogue rules;
- limit 1–50;
- max price bounded;
- min year bounded;
- five-minute shared cache;
- no personal data;
- no mutation.

## `POST /api/ai/vehicle-match`

Optional, bounded, server-only provider request as described above.

---

# 11. PWA and offline architecture

The service worker:

- uses a deterministic cache version;
- precaches public route shells and same-origin assets;
- uses network-first navigation;
- falls back to cached routes or designed 404/offline state;
- caches successful same-origin static assets;
- never caches `/api/`;
- removes old cache versions;
- does not cache selected photo content;
- does not cache secrets.

The application remains usable as a normal website when installation is unsupported or declined.

---

# 12. Security architecture

## Browser controls

- no account/session cookie;
- no analytics or advertising;
- no external browser scripts or fonts;
- same-origin assets;
- scoped, normalized local state;
- no inline event handlers;
- dynamic text escaped before insertion;
- optional object URLs revoked after photo preview.

## Vercel headers

- Content Security Policy;
- Strict Transport Security;
- frame denial;
- MIME-sniffing prevention;
- strict referrer policy;
- Cross-Origin-Opener-Policy;
- Cross-Origin-Resource-Policy;
- disabled geolocation, camera, microphone, payment, USB, and browsing topics;
- DNS prefetch disabled;
- cross-domain policy disabled.

CSP allows `blob:` images only for the local photo-preview object URL. Provider network access occurs server-side.

---

# 13. Developer and release architecture

## One release gate

```bash
npm run verify
```

Runs:

```text
JavaScript syntax and policy scan
→ Node test suite
→ production build
→ document, metadata, asset, manifest, service-worker and Vercel verification
→ real local HTTP smoke tests
→ deterministic second-build comparison
```

## CI

GitHub Actions:

- Node.js 24;
- deterministic `npm ci --ignore-scripts`;
- `npm audit --omit=dev`;
- complete `npm run verify`;
- read-only permissions;
- concurrency cancellation;
- ten-minute timeout.

## Vercel

```text
Framework: Other
Node.js: 24.x
Install: npm ci --ignore-scripts
Build: npm run build
Output: dist
Functions: api/**/*.js
Region: iad1
Production branch: main
```

---

# 14. Future live vehicle marketplace architecture

A real system should be built as a separate programme rather than turning on persistence in the portfolio release.

## Recommended bounded contexts

```text
Identity and access
Dealership/tenant management
Vehicle master data
Inventory listing and provenance
Media ingestion and moderation
Saved vehicles and customer profiles
Test-drive availability and bookings
Notifications
Finance education and regulated handoff
Vehicle-history integrations
Administration and audit
Trust, safety and complaints
Privacy and retention
Observability and incident response
```

## Example production topology

```text
Vercel / CDN
└── current patched Next.js customer and staff applications

Application services
├── inventory service
├── booking service
├── customer profile service
├── media workflow
├── notification service
└── audit service

Data
├── PostgreSQL
├── Redis / queue
├── private object storage + CDN
└── audit/event store

External providers
├── identity provider
├── email/SMS
├── vehicle-history/VIN provider
├── recall/title/lien sources
├── optional AI provider
└── observability/security tooling
```

## Authorization

Choose one identity provider. Every server mutation must enforce role and record ownership independently of route visibility.

Conceptual interfaces:

```ts
type Role = "CUSTOMER" | "SALES" | "INVENTORY_MANAGER" | "ADMIN"

interface Actor {
  userId: string
  organizationId: string
  roles: Role[]
  sessionId: string
}

async function requirePermission(
  actor: Actor,
  permission: string,
  resource?: { organizationId: string; ownerId?: string }
): Promise<void>
```

Never use user-editable metadata as the source of authorization. If Supabase Data API is used, enable RLS on every exposed table, use ownership predicates, and never expose service-role credentials to the browser.

## Database integrity

Critical constraints belong in PostgreSQL:

```text
vehicle.price > 0
vehicle.mileage >= 0
vehicle.year within approved range
vehicle.seats within approved range
unique organization/listing identifiers
booking start < booking end
booking date not historical at creation
atomic slot conflict protection
```

Example conceptual booking transaction:

```ts
await db.transaction(async tx => {
  const slot = await tx.testDriveSlot.reserve({
    vehicleId,
    date,
    startTime,
    organizationId,
  })

  if (!slot) throw new SlotUnavailableError()

  return tx.testDriveBooking.create({
    actorId: customerId,
    vehicleId,
    slotId: slot.id,
    notes: validatedNotes,
  })
})
```

A database constraint must make the reservation conflict atomic.

## Media workflow

```text
Client requests signed upload
→ direct upload to private quarantine
→ validate magic bytes, type, size and dimensions
→ malware/content moderation
→ create normalized derivatives
→ publish approved object IDs
→ reconciliation job removes orphaned uploads
```

Do not accept large base64 arrays through an application mutation.

## AI workflow

- optional;
- rate-limited;
- server-only key;
- visible attributes only;
- strict structured output schema;
- human review before inventory publication;
- no raw response logging;
- no safety-critical or commercial guesses;
- provider timeout/circuit breaker;
- cost and quota monitoring.

## Service initialization

In a future Next.js application, initialize database, Redis, storage, and external SDK clients lazily inside server-only getters rather than at module import time. This reduces build-time failures and isolates optional-service configuration.

## Observability

Use structured logs with:

```text
requestId
actorId (pseudonymous where appropriate)
organizationId
action
resourceId
result
errorCode
latency
```

Never log uploaded images, identity documents, credentials, finance form values, private notes, or full provider payloads.

## Privacy and operations

Before launch define:

- data inventory and lawful purpose;
- customer/dealer privacy notices;
- retention/deletion/export;
- account recovery;
- staff access reviews;
- incident response;
- complaint and fraud procedures;
- backups and disaster recovery;
- vendor agreements;
- accessibility testing;
- threat modelling;
- penetration testing;
- consumer-protection and financing legal review.

---

# 15. Architecture decision summary

| Decision | Current release | Future live system |
|---|---|---|
| Catalogue | Release-controlled fictional data | Durable tenant-owned inventory |
| Identity | None | One verified provider + server roles |
| Saved cars | Browser-local | Per-user authorized records |
| Comparison | Browser-local, max 3 | Per-user optional sync |
| Test drive | Local reminder | Transactional booking service |
| Finance | Educational calculator | Regulated handoff if approved |
| Images | Local illustrations; ephemeral AI input | Quarantined direct-upload workflow |
| AI | Optional visible-attribute matcher | Human-reviewed assistive workflow |
| Admin | Synthetic local state | Audited staff operations |
| Database | None | PostgreSQL with constraints/RLS strategy |
| Deployment | Vercel static + Functions | Vercel + durable application/data services |
