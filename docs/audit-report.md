# AI Car Marketplace audit and DriveLens Market Lab rebuild

Review date: 27 July 2026

## Executive conclusion

The uploaded ZIP is an AI-assisted car marketplace tutorial application, not BitGora. It contains a meaningful set of product ideas—catalogue discovery, saved cars, finance estimates, test-drive booking, image-assisted inventory entry, and an administrator surface—but its current production boundary is not safe or coherent enough to publish as a real dealership or vehicle marketplace.

The most important issue is not simply that the code is older. The application combines customer discovery, dealership operations, identity, image storage, AI inference, reservation writes, financing language, and staff administration without a sufficiently explicit operating model for ownership, authorization, data governance, transaction integrity, privacy, or legal responsibility.

The recommended and implemented next evolution is **DriveLens Market Lab**: a clean-room, fictional Canadian vehicle-discovery portfolio demonstration. It preserves the strongest product concepts while deliberately removing unsupported live-dealership claims and high-risk data flows.

```text
Uploaded application
Next.js + Clerk + Prisma/PostgreSQL + Supabase Storage + Gemini + Arcjet

Rebuilt portfolio release
Static-first generated pages + browser-local private tools + three bounded Vercel Functions
```

The clean-room implementation is not a cosmetic rebrand. It is a product-boundary correction.

---

# 1. Audit methodology

The review used:

1. the uploaded ZIP as the primary code evidence;
2. the ZIP’s embedded Git metadata for provenance only;
3. file-level and line-level inspection of routes, Server Actions, schema, middleware, hooks, and large UI components;
4. dependency and environment-variable inventory;
5. route and user-journey tracing;
6. clean-room implementation and independent verification;
7. automated unit, document, API, HTTP, determinism, secret, and browser-harness checks.

The original dependency installation could not be completed reliably in the review environment. No unsupported legacy vulnerability count is claimed.

The archive’s approximately ninety apparent Git modifications were confirmed to be end-of-line conversion noise: the working tree became clean when compared while ignoring end-of-line whitespace. Recommendations therefore distinguish actual code defects from archive-format noise.

---

# 2. Original product architecture

## 2.1 Existing modules found

The uploaded application already contained these product areas:

- public homepage and featured inventory;
- vehicle search and filtering;
- vehicle detail pages;
- saved vehicles;
- finance/EMI calculator;
- authenticated test-drive booking;
- reservation management;
- sign-in and sign-up through Clerk;
- administrator dashboard;
- administrator vehicle inventory;
- administrator vehicle creation;
- administrator test-drive management;
- dealership settings and working hours;
- user-role management;
- Gemini-assisted car-image analysis;
- Supabase image storage;
- Arcjet bot/shield middleware.

This is a substantial feature set, but it is not one coherent operating model.

## 2.2 Product fragmentation

### Observation

The customer experience implies a live dealership, while the operational architecture implies a single manually administered inventory, and the AI experience implies that a photograph can populate commercially significant vehicle facts.

The application does not answer these essential questions consistently:

- Is this a dealership, a multi-seller marketplace, or a listing portal?
- Who legally owns each vehicle record?
- Who is authorized to publish or delete inventory?
- Are prices, mileage, year, fuel type, transmission, and condition verified?
- Does booking a slot create a real appointment?
- Is finance information educational or an application pathway?
- Who is responsible for title, lien, recall, inspection, and history verification?
- What happens when storage succeeds but the database write fails?
- What happens when two customers reserve the same slot concurrently?
- What data must be retained, deleted, exported, or audited?

### Impact

The interface can create more user confidence than the data and operating model justify. This is particularly risky for vehicles because year, mileage, title, condition, financing, and reservation availability are materially important.

### Implemented correction

DriveLens explicitly classifies itself as a fictional portfolio demonstration. It supports discovery and planning without creating a sale, financing application, account, real reservation, identity record, or uploaded-image archive.

---

# 3. Source-backed code audit

## 3.1 Dependency and release surface

### Observation

`package.json` combines twenty-plus runtime packages across identity, bot protection, database, storage, AI, forms, validation, date handling, UI primitives, theming, drag/drop, notifications, and build tooling. The project uses Next.js `15.1.7` and React `19.0.0` and has no meaningful test command. Its lint command is `next lint`, which is not a durable release contract for current Next.js tooling.

Evidence:

```text
package.json:5–10    scripts
package.json:12–46   runtime dependencies
package.json:34      next 15.1.7
package.json:36–38   React/React DOM 19.0.0
```

### Impact

- Large upgrade surface.
- Seven external service/config groups must all be correct.
- Basic pages can fail because an unrelated identity, database, bot, or storage service is unavailable.
- No deterministic full quality gate exists.

### Recommendation for a future live system

Use a current patched Next.js release, one explicit authentication provider, a documented infrastructure contract, dependency pinning, automated migrations, and CI that runs type checking, linting, unit tests, integration tests, and a production build.

### Implemented portfolio correction

The clean-room release has zero external npm dependencies and one command:

```bash
npm run verify
```

It runs syntax/policy checks, tests, build verification, HTTP smoke tests, and deterministic comparison.

---

## 3.2 AI inference overreach

### Observation

`actions/cars.js:20–126` uses Gemini 1.5 Flash and asks the model to infer or guess:

- approximate year;
- mileage;
- fuel type;
- transmission;
- price;
- listing description.

The code logs the raw provider response when parsing fails (`actions/cars.js:116–117`) and concatenates the provider error into a thrown application error (`actions/cars.js:123–126`).

### Impact

A photograph cannot reliably establish mileage, exact year, title, ownership, price, fuel system, transmission, mechanical condition, recall status, or roadworthiness. Presenting guesses as inventory fields can produce materially misleading listings. Raw provider output can also place image-derived or prompt-derived content in logs.

### Recommendation

AI assistance must be bounded to visible, non-sensitive attributes and must never become the authoritative source for commercial or safety-critical fields. Human verification and source provenance must remain visible.

### Implemented correction

The optional DriveLens photo matcher:

- accepts JPEG, PNG, or WebP under 4 MB;
- uses a server-only key;
- asks only for visible colour, body type, general make cue, and visible features;
- explicitly prohibits VIN, ownership, year, price, mileage, mechanical condition, and safety guesses;
- returns a limitation statement and confidence;
- produces catalogue similarities rather than a listing;
- does not store the image;
- remains optional and fails safely when Gemini is unconfigured or unavailable.

---

## 3.3 Inventory authorization defects

### Observation

`addCar` checks only that a user exists (`actions/cars.js:130–139`); it does not require the `ADMIN` role. `deleteCar` checks authentication but not administrative authorization (`actions/cars.js:264–268`). `updateCarStatus` has the same problem and accepts status without an allowlist (`actions/cars.js:333–351`).

### Impact

Any authenticated database user could potentially create inventory, delete vehicles, or alter public status/featured state. Protecting the page route alone is not sufficient authorization; the server-side mutation itself must enforce the policy.

### Recommendation for a future live system

Centralize authorization in server-owned services:

```ts
await requireRole("ADMIN")
const input = UpdateCarStatusSchema.parse(payload)
await inventoryService.updateStatus({ actorId, carId, status: input.status })
```

Log actor, target, before/after state, request ID, and reason.

### Implemented portfolio correction

The current Admin surface is synthetic and browser-local. It has no public mutation API and no claim that a status change updates real inventory.

---

## 3.4 Upload validation and consistency

### Observation

`addCar` receives base64 image data from the client and validates mainly with `startsWith("data:image/")` (`actions/cars.js:152–168`). It trusts the client MIME subtype to choose file extension and content type. Uploads are performed sequentially, before the database record is created (`actions/cars.js:149–214`). If a later upload or the database create fails, uploaded objects can remain orphaned. The public URL is constructed manually from `NEXT_PUBLIC_SUPABASE_URL` (`actions/cars.js:185–188`).

### Impact

- weak file-type and size assurance;
- memory pressure from base64 payloads;
- long sequential request duration;
- orphaned storage objects;
- fragile coupling to public bucket URL structure;
- incomplete cleanup/audit story.

### Recommendation for a future live system

Use signed direct uploads, byte/magic-number validation, explicit size/dimension limits, quarantine/moderation, server-generated object keys, a transaction/outbox workflow, and cleanup jobs. Store object identifiers rather than hand-constructed public URLs.

### Implemented portfolio correction

The static catalogue uses original local illustrations. Optional photo matching sends one bounded image to a short-lived Function and retains nothing.

---

## 3.5 Delete ordering and asynchronous API misuse

### Observation

`deleteCar` deletes the database record before attempting storage cleanup (`actions/cars.js:282–315`). Storage failure is logged and ignored. It also calls `cookies()` without awaiting it at line 289, conflicting with the asynchronous Next.js request API model used elsewhere in the project.

### Impact

The system can create permanent orphan files and inconsistent operational evidence. Async API misuse can fail during framework upgrades or runtime execution.

### Recommendation

A future implementation should mark records pending deletion, perform storage deletion idempotently, then finalize database state—or use an outbox/worker and cleanup reconciliation. Framework request APIs must follow the currently supported async contract.

### Implemented correction

No upload or delete workflow exists in the portfolio release.

---

## 3.6 Anonymous vehicle-detail failure

### Observation

`getCarById` deliberately permits anonymous access by setting `dbUser = null`, but later uses `dbUser.id` while searching for an existing test drive (`actions/car-listing.js:265–308`).

### Impact

An unauthenticated visitor opening a vehicle detail page can trigger a null-reference failure in what should be a public discovery journey.

### Implemented correction

All twelve DriveLens detail pages are complete static routes. Public vehicle discovery is independent of identity and external service availability.

---

## 3.7 Test-drive race condition

### Observation

`bookTestDrive` checks for an existing slot with `findFirst` and then performs a separate `create` (`actions/test-drive.js:37–64`). The schema has indexes on car, user, date, and status but no unique slot constraint (`prisma/schema.prisma:119–137`).

### Impact

Two concurrent requests can both observe an available slot and create conflicting bookings.

### Recommendation for a future live system

Enforce uniqueness in the database, not only in application code. For fixed slots, a partial/derived constraint or transactional reservation design should make the conflict atomic. Example conceptual key:

```text
(car_id, booking_date, start_time, active_status)
```

The service should translate constraint conflicts into a user-safe “slot no longer available” response.

### Implemented correction

DriveLens creates a browser-local reminder only. The UI says clearly that no dealership receives it and no slot is reserved.

---

## 3.8 Broken cancellation authorization

### Observation

The cancellation condition is:

```js
if (booking.userId !== user.id || user.role !== "ADMIN")
```

at `actions/test-drive.js:181–187`.

This denies a normal owner because the role comparison is true, and it denies an administrator cancelling someone else’s booking because the ownership comparison is true.

### Impact

The intended policy—booking owner **or** administrator—cannot work.

### Correct policy

Conceptually:

```js
const mayCancel = booking.userId === user.id || user.role === "ADMIN"
if (!mayCancel) deny()
```

The policy must still be server-enforced and tested across owner, unrelated user, and administrator cases.

### Implemented correction

Local reminders can be removed only from the current browser state; no authorization claim is made.

---

## 3.9 Weak server-side validation

### Observation

Test-drive date, start/end strings, and notes are accepted with limited server validation (`actions/test-drive.js:11–64`). Vehicle create/update actions also accept broad objects without a complete server-owned schema. Database columns for price, year, mileage, and seats lack check constraints (`prisma/schema.prisma:30–58`).

### Impact

Client validation can be bypassed. Invalid dates, ranges, prices, mileage, seat counts, or free text can enter the database and break downstream assumptions.

### Recommendation

Use shared runtime schemas at the action boundary and enforce critical invariants again in PostgreSQL:

- year range;
- non-negative mileage;
- positive price;
- supported status/body/fuel/transmission values;
- seats range;
- booking date not in the past;
- canonical time representation;
- note length and control-character policy.

### Implemented correction

All DriveLens local state is normalized through bounded pure functions. The catalogue and API are tested against explicit allowlists and ranges.

---

## 3.10 Mutation during a read path

### Observation

`getDealershipInfo` creates default dealership information and working hours when no record exists. `checkUser` also creates a local database user as a side effect of a general request/read helper (`lib/checkUser.js:4–36`).

### Impact

Reads are no longer referentially predictable. Rendering or checking a session can mutate durable state, complicating cache behaviour, retries, audit logs, tests, and failure recovery.

### Recommendation

Provision default configuration through migrations/bootstrap commands, and synchronize identity through an explicit idempotent onboarding event or webhook. Query functions should query.

### Implemented correction

The fictional branch catalogue is immutable release content. Browser-local admin announcements and statuses are explicit local actions.

---

## 3.11 Non-transactional dealership settings update

### Observation

`saveWorkingHours` deletes all existing rows and then creates replacement rows sequentially (`actions/settings.js:122–138`).

### Impact

A failure after deletion but before all inserts completes leaves partial or empty hours. Concurrent updates can interleave.

### Recommendation

Validate the complete weekly schedule, enforce one row per dealership/day, and replace it inside one database transaction or use atomic upserts.

### Implemented correction

DriveLens branch hours and notices are fictional release content/local state; no durable settings mutation occurs.

---

## 3.12 Unbounded administrative user access and weak role updates

### Observation

`getUsers` loads every user (`actions/settings.js:152–179`). `updateUserRole` accepts `role` without an explicit allowlist and contains no self-demotion or last-administrator protection (`actions/settings.js:185–214`).

### Impact

- cost and response size grow unbounded;
- an invalid role can be attempted;
- the system can remove its final administrative path;
- sensitive user data is exposed more broadly than necessary.

### Recommendation

Use pagination, least-field selection, explicit role enums, audit events, step-up authentication, and invariants preventing removal of the final administrator.

### Implemented correction

The portfolio Admin surface has no user-management capability.

---

## 3.13 Dashboard aggregation inefficiency

### Observation

The admin dashboard loads complete sets of cars and test drives into application memory and calculates counts with JavaScript filters (`actions/admin.js:178–258`). Admin test-drive retrieval also loads detailed user and vehicle data without bounded pagination.

### Impact

Database, memory, and transfer costs scale with all historical records rather than the small metrics requested.

### Recommendation

Use database aggregate queries, grouped counts, bounded recent activity, cursor pagination, and explicit time windows.

### Implemented correction

Synthetic metrics are derived from twelve local catalogue records and bounded local reminders.

---

## 3.14 Error disclosure and observability

### Observation

Several actions return `error.message` or throw strings that concatenate underlying provider/storage/database errors. Console logging is inconsistent and sometimes logs raw provider output.

### Impact

Internal implementation details can leak to clients, while operational logs lack consistent request IDs, error codes, severity, and structured context.

### Recommendation

Use typed public errors and structured internal errors:

```json
{
  "error": {
    "code": "slot_unavailable",
    "message": "That test-drive time is no longer available."
  },
  "requestId": "..."
}
```

Log only sanitized identifiers and never raw images, credentials, private notes, or full provider payloads.

### Implemented correction

DriveLens Functions return bounded codes/messages and request IDs. Provider failures are converted to safe `503` responses.

---

## 3.15 Global response security gap

### Observation

`next.config.mjs:15–27` adds a narrow CSP only to `/embed`. The rest of the site has no version-controlled global CSP, HSTS, frame, referrer, MIME, permissions, or cross-origin policy configuration.

### Impact

Security posture depends on deployment defaults and does not travel reliably with the repository.

### Implemented correction

`vercel.json` now defines a global restrictive CSP, HSTS, frame denial, MIME-sniffing prevention, strict referrer policy, cross-origin opener/resource policies, disabled device/payment permissions, and controlled caching.

---

## 3.16 Service initialization and base-site availability

### Observation

Arcjet and Clerk middleware are configured at module scope (`middleware.js:1–43`). Database and provider clients also form part of general request/render paths. The base site therefore carries a large external-configuration failure surface.

### Impact

A missing unrelated key can make public discovery unavailable. Build and runtime behaviour are harder to isolate.

### Recommendation for a future live Next.js system

Initialize database, Redis, storage, and provider SDKs lazily inside server-only getters, keep public cached discovery routes independent where possible, and fail optional services independently.

### Implemented correction

The public DriveLens catalogue is static. Optional Gemini photo matching is isolated to one Function and does not affect any public route or Smart Match.

---

## 3.17 Client request hook race and lifecycle weaknesses

### Observation

`hooks/use-fetch.js` creates a new callback every render, has no request cancellation, no stale-response protection, and no unmount protection (`hooks/use-fetch.js:4–25`).

### Impact

Overlapping requests can render old data after newer requests, and state updates can occur after navigation/unmount. Error feedback is coupled to a global toast rather than the actual component state.

### Recommendation

Prefer Server Components for server data. For client requests, use an abortable request state machine with stable callbacks and explicit idle/loading/success/empty/error states.

### Implemented correction

Most DriveLens content is generated HTML. Client interactions use bounded local modules; photo matching prevents duplicate submits and uses explicit status rendering.

---

## 3.18 Oversized components and mixed concerns

### Observation

Large files include:

```text
762 lines  add-car-form.jsx
536 lines  settings-form.jsx
503 lines  test-drive-form.jsx
464 lines  car-details.jsx
442 lines  dashboard.jsx
377 lines  car-list.jsx
302 lines  emi-calculator.jsx
294 lines  car-filters.jsx
```

These components mix domain validation, provider calls, state, rendering, calculations, dialog control, navigation, and notifications.

### Impact

- difficult testing;
- risky refactors;
- hidden coupling;
- inconsistent state transitions;
- duplicated formatting and validation;
- slower onboarding for maintainers.

### Recommendation

Split by feature boundary and extract pure rules before extracting generic UI. A future live structure could be:

```text
src/features/inventory/
  inventory.schema.ts
  inventory.service.ts
  inventory.repository.ts
  components/vehicle-form.tsx
  components/image-uploader.tsx
  components/vehicle-status-menu.tsx

src/features/test-drives/
  booking.schema.ts
  booking.service.ts
  booking.repository.ts
  components/slot-picker.tsx
  components/booking-summary.tsx

src/features/finance/
  finance-calculator.ts
  components/finance-planner.tsx
```

### Implemented correction

The clean-room source separates catalogue, finance, saved/compare state, reservations, admin state, server handlers, templates, and browser rendering into small bounded modules.

---

# 4. UX audit

## 4.1 Onboarding

### Observation

The original homepage presents marketplace and AI capabilities before clearly establishing whether the site is a live dealership, tutorial, or demonstration. Authentication appears as a prerequisite for saved cars and reservations, but the value and data consequences are not explained.

### Risk

Visitors may believe inventory, prices, financing, inspection, and appointment availability are authoritative.

### Implemented correction

DriveLens starts with a visible demonstration boundary, explains fictional data, and gives direct paths to Browse, Smart Match, Finance Planner, Test-drive planning, and Safety.

---

## 4.2 Search and filtering

### Observation

The existing catalogue has useful search/filter concepts, but state is spread among large components, URL state, client controls, and server actions. Initial, empty, loading, and provider-failure states are inconsistent.

### Implemented correction

DriveLens provides:

- text search;
- natural-language parsing for basic body/fuel/budget/year cues;
- body, fuel, drivetrain, status, branch, year, and maximum-price filters;
- sort options;
- result count;
- reset;
- no-result recovery;
- durable detail routes.

---

## 4.3 Saved vehicles and comparison

### Observation

Saved cars require an account and database record. The original project does not provide a bounded, transparent comparison model.

### User friction

A visitor must disclose identity to retain a lightweight preference, and cannot clearly compare a small number of vehicles side by side.

### Implemented correction

Saved vehicles and comparison are private browser-local tools. Comparison is bounded to three vehicles to protect readability and cognitive load.

---

## 4.4 Finance experience

### Observation

The EMI calculator provides a useful estimate but risks appearing as a lending pathway. Currency and jurisdiction cues are inherited from tutorial/default dealership content rather than a clearly defined market.

### Implemented correction

The Finance Planner uses CAD, labels every result educational, accepts bounded price/down-payment/rate/term inputs, explains that fees/taxes/insurance and lender decisions are excluded, and transmits nothing.

A browser interaction test found and corrected a real defect in the rebuild: `Number(null)` caused the default $45,000 price to become zero when no `price` query parameter existed. The route now retains the intended default.

---

## 4.5 Test-drive journey

### Observation

The original product calls the flow a booking and creates a durable record, but its concurrency and authorization defects mean it cannot guarantee a real slot.

### Implemented correction

The new flow is explicitly a local planning reminder. It includes branch, date, time, notes, validation, status, removal, and reset without claiming that anyone receives or confirms it.

---

## 4.6 AI experience

### Observation

The original AI workflow aims to replace manual inventory facts, which encourages over-trust.

### Implemented correction

DriveLens provides two distinct experiences:

1. **Smart Match** — deterministic, explainable matching from user-stated needs.
2. **Photo Match** — optional visible-attribute assistance with strong limitations.

The non-AI path is fully functional when no key is configured.

---

## 4.7 Administration

### Observation

The original Admin route contains useful operational concepts but mixes real authorization, settings, user roles, inventory, test drives, and analytics. Users cannot easily distinguish configuration from live operational effects.

### Implemented correction

The DriveLens Admin concept uses synthetic inventory state, local reminder status, a fictional branch notice, and reset. Every route says no change reaches a dealership backend.

---

## 4.8 Navigation, hierarchy, and recovery

### Implemented improvements

- responsive desktop and mobile navigation;
- active-route indication;
- skip link;
- command palette;
- light/dark/system themes;
- designed offline, empty, unavailable, validation, and 404 states;
- related-vehicle navigation;
- explicit public vs local-tool vs admin labels;
- mobile-safe filter and comparison layouts;
- no authentication dead end.

---

# 5. Developer productivity audit

## Original friction

- No complete test suite.
- No single deterministic quality gate.
- Build depends on Prisma generation and external configuration.
- Several UI files exceed 400–700 lines.
- Business rules are embedded in React components and Server Actions.
- Error handling varies by file.
- Data mutation and data retrieval are mixed.
- Third-party clients are coupled to general requests.
- No repository-wide source/provenance boundary is documented.
- Environment variables are not grouped by capability or failure impact.

## Implemented productivity improvements

```bash
npm ci --ignore-scripts
npm run dev
npm run lint
npm test
npm run build
npm run smoke
npm run verify
```

The repository now includes:

- `AGENTS.md` — future Codex/maintainer rules;
- `README.md` — product and architecture orientation;
- `DEPLOYMENT.md` — exact Vercel release gates;
- `SECURITY.md` — security and privacy boundary;
- `NOTICE.md` — provenance and clean-room status;
- `docs/audit-report.md`;
- `docs/architecture.md`;
- `docs/owner-decisions.md`;
- `docs/verification-report.md`;
- GitHub Actions using Node.js 24;
- zero-dependency deterministic build/test tooling.

---

# 6. Quick wins completed

1. Removed the null-user vehicle-detail failure by replacing database-coupled detail rendering with complete static routes.
2. Removed unauthorized live inventory mutations.
3. Removed broken cancellation authorization.
4. Removed check-then-create booking races from the public release.
5. Removed public image storage and cleanup inconsistency.
6. Removed AI guesses for mileage, price, exact year, condition, ownership, and safety.
7. Removed raw provider-response logging.
8. Removed fake California dealership defaults and moved the concept to a fictional Canadian context.
9. Added global security headers.
10. Added complete loading, empty, error, unavailable, offline, and 404 states.
11. Added private saved and compare tools.
12. Added finance and local test-drive validation.
13. Added deterministic tests and release checks.
14. Added clear source provenance.
15. Added Vercel-ready build and Functions.
16. Added PWA manifest/service worker.
17. Added indexing controls.
18. Added browser interaction verification.

---

# 7. Larger architectural work deliberately deferred

A real vehicle marketplace or dealership application is a separate programme, not a configuration switch.

It would require:

- verified organization/dealership ownership;
- identity and secure account recovery;
- server-enforced role and record authorization;
- administrator step-up authentication;
- seller/dealer tenancy boundaries;
- VIN normalization and trusted vehicle-history providers;
- title, lien, recall, inspection, and certification workflows;
- listing provenance and evidence;
- immutable audit logs;
- direct-upload quarantine and image moderation;
- atomic inventory/storage lifecycle;
- transactional booking and availability constraints;
- notification and appointment operations;
- financing/legal disclosure and lender integration governance;
- consent, retention, deletion, export, and incident-response procedures;
- observability and rate limiting;
- backups and disaster recovery;
- threat modelling and penetration testing;
- legal, consumer-protection, accessibility, privacy, and financial review.

See `docs/architecture.md` for the recommended future system boundaries.

---

# 8. Final recommendation

Use the Vercel-ready DriveLens source as the portfolio release. Do not deploy the original tutorial as a live vehicle marketplace.

The current clean-room release is appropriately sophisticated for a portfolio demonstration because it demonstrates:

- product architecture;
- explainable matching;
- optional bounded multimodal AI;
- static-first performance;
- state-machine design;
- API design;
- security boundaries;
- privacy-by-design;
- accessible responsive UX;
- PWA/offline capability;
- deterministic verification.

A future live marketplace should start from the separate architecture plan rather than gradually adding production data to the demonstration.
