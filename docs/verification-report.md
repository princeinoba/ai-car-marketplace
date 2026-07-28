# DriveLens Market Lab verification report

Verification date: 27 July 2026

## Status

```text
PASS — implementation, local browser, clean-room and deterministic release gates passed.
External GitHub CI, Vercel Preview, optional live Gemini and public Production gates remain pending.
```

## Execution environment

```text
Node.js: v24.18.0
npm: 10.2.4
Vercel CLI: 57.0.0
Browser verifier: agent-browser 0.33.0 / Chromium 150
axe-core: 4.12.1
```

The project has zero external npm dependencies. Installation and audit passed with zero known vulnerabilities.

## Final local release gate

Command:

```bash
npm ci --ignore-scripts
npm audit --omit=dev
npm run verify
git diff --check
```

Results:

```text
Syntax and policy files: 29 passed
Automated tests: 47 passed, 0 failed
Canonical generated routes: 28
Physical HTML files: 29
Generated files: 59
Complete generated output: 772,094 bytes
Browser JavaScript: 29,198 bytes
CSS: 29,374 bytes
HTTP smoke assertions: 82 passed
High-confidence secret scan: 125 text/source/generated files, 0 findings
Deterministic generated-tree SHA-256:
c443fabe8d985081e6e16c92d790a54b839d385beaf9b52fced75c542b27a8f4
```

Budgets passed:

```text
Complete dist: 772,094 / 1,500,000 bytes
Browser JavaScript: 29,198 / 120,000 bytes
CSS: 29,374 / 60,000 bytes
External npm packages: 0
```

## Clean-room verification

An empty temporary directory received only intended repository files. `.git`, `.vercel`, `node_modules`, `dist`, ZIP files, environment values, browser state and temporary evidence were excluded.

```text
Intended source files: 81
npm ci --ignore-scripts: pass
npm audit --omit=dev: 0 vulnerabilities
npm run verify: pass
Syntax/policy files: 29
Tests: 47
Routes: 28
Physical HTML: 29
Generated files: 59
HTTP assertions: 82
Secret findings: 0
Deterministic hash: c443fabe8d985081e6e16c92d790a54b839d385beaf9b52fced75c542b27a8f4
```

The clean-room directory was removed after verification.

## Browser verification

All 28 canonical routes were directly navigated in Chromium across a rotating matrix of:

```text
390 × 844
768 × 1024
1440 × 900
1536 × 1024
```

Every route rendered meaningful content with exactly one `main`, exactly one primary `h1`, and no horizontal overflow.

Representative axe audits covered Home, Cars, one vehicle detail, Smart Match, Compare, Finance, Test-drive, Admin and 404:

```text
Pages audited: 9
Accessibility violations: 0
Serious/critical violations: 0
Incomplete checks: 1 per page
```

The incomplete item is axe's inability to determine the effective background behind gradient-backed header/page-hero text. Directly measurable contrast defects found during this execution were fixed: the light warning colour now passes, the disclosure is a named landmark, and the catalogue heading sequence is valid.

Browser interactions passed:

- mobile menu open/Escape/focus restoration;
- command-palette keyboard opening and input focus;
- light/dark/system theme persistence;
- catalogue search (`electric` → 3 cards), reset (`12` cards), saved count and compare maximum of three;
- deterministic Smart Match (three scored results with explicit reasons);
- local photo preview using a blob URL, unconfigured-AI fallback, and no photo/image storage key;
- finance default CAD 45,000 (`$908 / month`) and zero-rate branch (`$764 / month`) with no API request;
- validation summary focus for an incomplete test-drive plan;
- future local reminder creation, status update, removal and no-dealership/no-slot disclosure;
- synthetic inventory override, branch notice and Admin-only reset isolation;
- designed 404 and all public/local/Admin route shells.

Browser runtime evidence:

```text
Console messages: 0
Page errors: 0
CSP violations: 0
Horizontal-overflow defects: 0
Unexpected completed same-origin failures: 0
Expected AI-unconfigured response: one bounded 503
Expected offline proof: uncached /api/ request blocked
Cancelled lazy images during rapid route navigation: 4; the same assets later completed with HTTP 200
```

## PWA and offline

```text
Service-worker scope: /
Active controller: yes
Cache: drivelens-5aa79bb1ab33
Cached API entries: 0
Offline uncached API request: blocked
Offline cached /safety/ navigation: pass
```

The manifest, 192px/512px icons, service worker, robots, sitemap and security contact are also covered by build and HTTP smoke verification.

## Local Lighthouse

A valid Lighthouse 13 JSON report was produced before the Windows launcher reported a temporary-profile cleanup `EPERM` after completion.

```text
Performance: 100
Accessibility: 100
Best Practices: 100
SEO: 58
```

The SEO score is intentionally constrained by the approved `noindex`/robots-disallow portfolio policy and was not improved by weakening that safety decision.

## Gemini review and hardening

Official Google AI documentation was rechecked on 27 July 2026. `gemini-2.5-flash` remains a stable model with image input, text output and structured output support. Google now documents `x-goog-api-key` header authentication.

The handler was hardened to:

- send the key only in `x-goog-api-key`, never the URL;
- request a bounded structured response schema and 320 output tokens;
- prohibit licence-plate identification and all VIN, owner, exact-year/trim, mileage, value, title/lien, condition, accident, roadworthiness, safety, theft, insurance and financing inference;
- preserve a 12-second timeout, normalized contract, no raw logging, no image retention and bounded failures.

Regression tests verify that the provider URL contains no key and the header/schema/safety boundary are present.

## Defects found and fixed during execution

1. Windows file-URL paths produced `C:\C:\...` in four build/verification scripts; all now use `fileURLToPath`.
2. Gemini authentication placed the key in the provider URL; it now uses the documented request header.
3. The release gate lacked a reproducible repository/generated-output secret scan; it is now part of `npm run verify`.
4. axe found an unnamed disclosure region, insufficient light warning contrast and catalogue heading-order issue; all were corrected.
5. The required no-dealership/no-slot wording was incomplete on test-drive routes; exact disclosures and a regression test were added.

## Not yet claimed

This local report does not claim:

- GitHub Actions success for the final feature SHA;
- Vercel Preview or Production identity;
- Preview/Production Lighthouse scores;
- live Gemini key creation or model response;
- public Production smoke tests or runtime-log cleanliness.

Those claims require the exact pushed commit and the HTTPS Vercel deployments. No baseline number will be reused for those external gates.
