# AI car marketplace source inventory

Review date: 27 July 2026

## Uploaded archive

```text
File: ai-car-marketplace.zip
SHA-256: 21568a11d81a20fc30e68edf9adb8b32bcd6092f1ceece11c4e870441287a99c
```

## Embedded repository provenance

```text
Remote: https://github.com/piyush-eon/ai-car-marketplace.git
HEAD: 14cb93dff2ef8fd0b7aebf4971241d31f86f922d
Tracked files: 107
```

The embedded repository was used for audit evidence only and was not imported into the clean-room source.

## Apparent dirty state

The extracted repository reported approximately ninety modified files. `git diff --ignore-space-at-eol --quiet` returned clean, showing that the apparent changes were line-ending conversion rather than substantive edits.

## Stack inventory

| Capability | Original technology |
|---|---|
| Web application | Next.js 15.1.7 / React 19 |
| Authentication | Clerk |
| Database | PostgreSQL through Prisma |
| Image storage | Supabase Storage |
| AI | `@google/generative-ai`, Gemini 1.5 Flash |
| Bot/shield | Arcjet |
| Forms | React Hook Form + Zod |
| UI | Tailwind, shadcn/Radix, Lucide |
| Notifications | Sonner |
| Date/calendar | date-fns, React Day Picker |

## Environment/configuration groups

```text
DATABASE_URL
DIRECT_URL
Clerk keys and redirect variables
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GEMINI_API_KEY
ARCJET_KEY
deployment URL/configuration
```

## Original route families

```text
/
/cars
/cars/[id]
/saved-cars
/test-drive/[id]
/reservations
/sign-in
/sign-up
/waitlist
/admin
/admin/cars
/admin/cars/create
/admin/test-drives
/admin/settings
```

## Largest source files

| Lines | File |
|---:|---|
| 762 | `app/(admin)/admin/cars/create/_components/add-car-form.jsx` |
| 536 | `app/(admin)/admin/settings/_components/settings-form.jsx` |
| 503 | `app/(main)/test-drive/[id]/_components/test-drive-form.jsx` |
| 464 | `app/(main)/cars/[id]/_components/car-details.jsx` |
| 442 | `app/(admin)/admin/_components/dashboard.jsx` |
| 407 | `actions/car-listing.js` |
| 377 | `app/(admin)/admin/cars/_components/car-list.jsx` |
| 367 | `actions/cars.js` |
| 302 | `app/(main)/cars/[id]/_components/emi-calculator.jsx` |
| 294 | `app/(main)/cars/_components/car-filters.jsx` |
| 288 | `actions/admin.js` |

## Clean-room source retained concepts

- discovery and filtering;
- complete vehicle routes;
- saved vehicles;
- comparison;
- educational finance planner;
- test-drive planning;
- explainable matching;
- bounded optional photo matching;
- synthetic administration information architecture;
- PWA and responsive interface.

## Clean-room exclusions

- historical implementation code;
- embedded Git history;
- Clerk account flows;
- PostgreSQL/Prisma state;
- Supabase image storage;
- Arcjet dependency;
- real reservations;
- real financing applications;
- live administration;
- uploaded image retention;
- tutorial branding and fake California dealership identity;
- generated output and local dependencies.
