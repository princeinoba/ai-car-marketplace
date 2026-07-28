# DriveLens owner decisions before public release

Review date: 27 July 2026

The clean-room source is technically ready for a Vercel Preview. The decisions below cannot be inferred safely from the uploaded tutorial code.

## 1. Product identity

Approve or revise:

```text
Public name: DriveLens Market Lab
Positioning: fictional, privacy-first, AI-assisted Canadian vehicle marketplace portfolio demonstration
```

Confirm that the name and visual identity may be used publicly.

The release must not imply that DriveLens is:

- a licensed dealership;
- an automotive broker;
- a lender;
- an insurer;
- a vehicle-history provider;
- a reservation service;
- an inspection/certification authority.

## 2. Fictional catalogue

Review and approve the twelve fictional vehicles, prices, mileage, specifications, branch names, descriptions, inspection scores, delivery language, and illustrations.

The release should not be changed to real inventory without a separate live-system programme and verified data provenance.

## 3. Public indexing

Choose whether the portfolio release should eventually be indexed.

The safe initial state is:

```text
DRIVELENS_PUBLIC_INDEXING=false
robots.txt disallows crawling
sitemap is empty
public routes are noindex,follow
local/admin routes are noindex,nofollow
```

Normal indexing should be enabled only after:

- brand approval;
- content review;
- source/provenance review;
- production-domain approval;
- public disclosures are approved.

## 4. Production domain

Approve one stable Production origin before setting `SITE_URL`.

A Vercel-generated domain is acceptable for the initial portfolio release.

Never set a Preview URL as the permanent `SITE_URL`.

## 5. Optional Gemini photo matching

Decide whether to configure:

```text
GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash
```

Questions to approve:

- Is optional photo matching valuable enough to justify a provider dependency?
- Which environments should receive the key?
- What quota/cost limit should apply?
- Who monitors provider errors and model changes?
- Are the provider terms and privacy disclosures acceptable?
- Should the feature remain disabled in Production until an explicit review?

The base product remains complete without the key.

Do not reuse a key that has appeared in browser code, source history, screenshots, logs, or chat.

## 6. AI wording and safety boundary

Approve the current rule:

```text
AI may describe visible non-sensitive attributes and suggest similar fictional catalogue items.
AI may not identify or verify VIN, exact year, mileage, price/value, ownership, title, lien, mechanical condition, accident history, roadworthiness or safety.
```

No future prompt change should weaken this boundary without a formal safety and legal review.

## 7. Source provenance and licence

The uploaded archive is derived from a third-party tutorial repository:

```text
https://github.com/piyush-eon/ai-car-marketplace.git
Embedded archive HEAD: 14cb93dff2ef8fd0b7aebf4971241d31f86f922d
```

The clean-room replacement does not import the original implementation history.

Owner actions:

- confirm rights to the DriveLens name and local artwork;
- select a licence for the clean-room source before third-party redistribution;
- do not claim exclusive ownership of the historical tutorial implementation;
- retain `NOTICE.md` and the source archive hash.

## 8. Target GitHub repository

The owner-controlled repository exists and was empty at review time:

```text
princeinoba/ai-car-marketplace
```

Approve using it as the release repository.

The recommended workflow is:

```text
minimal main bootstrap if still empty
→ codex/drivelens-vercel-ready-rebuild
→ draft pull request
→ exact-commit CI and Preview
→ normal squash merge
→ Git-connected Production deployment
```

## 9. Future real marketplace decision

Decide whether DriveLens will remain a portfolio demonstration or become a real marketplace/dealership product.

A live system requires explicit decisions for:

### Organization and identity

- legal operating entity;
- dealership/seller model;
- customer identity requirements;
- staff roles;
- administrator step-up authentication;
- account recovery;
- minimum user age.

### Vehicle data

- inventory ownership;
- VIN provider;
- title/lien checks;
- recall checks;
- vehicle-history provider;
- inspection/certification process;
- odometer provenance;
- pricing authority;
- listing evidence and moderation.

### Test drives

- branch calendar ownership;
- slot capacity;
- staff assignment;
- cancellation/no-show policy;
- notification provider;
- identity/licence requirements;
- retention of appointment data;
- safety and insurance process.

### Finance

- educational-only calculator vs lender handoff;
- required disclosures;
- credit-data prohibition or approved collection;
- lender responsibilities;
- consent and retention;
- legal/compliance review.

### Privacy and security

- data inventory;
- lawful purposes;
- privacy notice;
- retention/deletion/export;
- staff access reviews;
- audit logs;
- backups;
- incident response;
- vendor/security reviews;
- penetration testing.

### Operations

- customer support;
- fraud and misleading-listing response;
- complaints;
- content removal;
- availability reconciliation;
- observability;
- disaster recovery;
- uptime objectives.

Do not add live database writes, accounts, uploads, or reservations to the static portfolio project before these decisions are approved.

## 10. Launch checklist

Before public Production promotion:

- [ ] Approve DriveLens name and positioning.
- [ ] Approve the twelve fictional vehicles and branches.
- [ ] Approve Vercel-generated domain or provide a stable domain.
- [ ] Confirm indexing remains disabled or explicitly approve it.
- [ ] Decide whether Gemini photo matching is enabled.
- [ ] Configure any Gemini key securely in Vercel only.
- [ ] Review Privacy, Safety, About, and AI limitation language.
- [ ] Confirm source/provenance and licence approach.
- [ ] Verify the Vercel Preview at mobile, tablet, desktop, and wide layouts.
- [ ] Run accessibility and Lighthouse checks against HTTPS Preview.
- [ ] Confirm Production deployment uses the merged `main` commit.
