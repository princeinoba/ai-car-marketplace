# Vercel deployment guide

## Effective settings

```text
Project: drivelens-market-lab (or approved repository-aligned name)
Framework preset: Other
Node.js: 24.x
Install command: npm ci --ignore-scripts
Build command: npm run build
Output directory: dist
Functions: api/**/*.js
Region: iad1
Production branch: main
```

`vercel.json` is the version-controlled source of truth for build settings, redirects, Functions, caching and response headers.

## 1. Local release gate

```bash
npm ci --ignore-scripts
npm audit --omit=dev
npm run verify
git diff --check
```

Do not deploy when any command fails.

## 2. GitHub workflow

1. Work on a feature branch.
2. Push the branch and open a draft pull request into `main`.
3. Require the DriveLens quality workflow on the exact head SHA.
4. Confirm no credential, `.env`, `.vercel`, `dist`, `node_modules`, uploaded ZIP or temporary browser profile is committed.
5. Use the Git-connected Preview for acceptance testing.
6. Mark ready and merge normally only after all gates pass.

## 3. Optional Gemini photo matching

Add this variable through Vercel’s secure project settings:

```text
GEMINI_API_KEY
```

Apply it only where photo matching is intended, normally Preview and Production, and mark it Sensitive.

Optional model override:

```text
GEMINI_MODEL=gemini-2.5-flash
```

Do not put the key in source, a shell command, a browser-prefixed variable or a pull-request description.

Official Google AI documentation was rechecked on 27 July 2026: gemini-2.5-flash remains stable with image input, text output and structured output. The server sends the credential only in the documented x-goog-api-key header, never in the request URL.

The base application must remain fully usable when the key is absent. `/api/health` reports whether optional photo AI is configured.

## 4. Preview gate

Verify on the exact Preview SHA:

### Routes

- `/`
- `/cars/`
- all twelve `/cars/:slug/` routes
- `/match/`
- `/compare/`
- `/saved/`
- `/finance/`
- `/test-drive/`
- `/reservations/`
- `/safety/`
- `/about/`
- `/privacy/`
- all four Admin routes
- designed 404
- `/api/health`
- `/api/cars`
- `/api/ai/vehicle-match`
- manifest, service worker, robots, sitemap and security contact

### Product flows

- search/filter/sort/reset/no-results;
- saved and compare limits/persistence;
- explainable Smart Match;
- optional photo match and safe unconfigured/provider-failure states;
- finance defaults and zero-interest case;
- local test-drive validation, persistence, status and removal;
- local inventory and announcement changes/reset;
- mobile navigation, theme and command palette;
- service-worker registration/update and true offline navigation.

### Browser quality

Test at 390×844, 768×1024, 1440×900 and 1536×1024. Require no serious accessibility defects, no keyboard trap, no horizontal overflow, no console/page errors, no unexpected failed same-origin requests, and no CSP violations.

Run Lighthouse and report measured results only.

### Security

- no key in browser assets, HTML, URLs, responses or logs;
- no uploaded photo retained by DriveLens;
- global security headers present;
- service worker does not cache `/api/`;
- private routes and demonstration state are `noindex,nofollow`;
- default public release remains `noindex,follow`, robots-blocked and with an empty sitemap.

## 5. Production release

Prefer Vercel Git integration after the verified pull request is merged to `main`.

Require the Production deployment to report:

```text
Target: production
Branch: main
Git SHA: final merged main SHA
State: READY
```

Do not treat a feature-branch deployment as the final release.

## 6. Stable origin and indexing

Leave these unset by default:

```text
SITE_URL
DRIVELENS_PUBLIC_INDEXING
```

The initial portfolio release remains public but non-indexable.

Only after explicit owner approval may indexing be enabled with:

```text
SITE_URL=https://approved-stable-domain
DRIVELENS_PUBLIC_INDEXING=true
```

Never set `SITE_URL` to a Preview URL.

## 7. Rollback

Record the previous Production deployment ID before promotion. Use Vercel rollback when the new release regresses, then repair source through a normal branch and pull request.

Browser-local state is not server data and is not reversed by a code rollback.
