# Security policy

## Supported version

Only the latest commit on `main` is supported.

## Reporting

Report a security issue privately to `royceinoba@gmail.com`. Do not include real identity documents, payment details, driver’s-licence data, vehicle documents, VIN reports, or confidential dealership records in a report.

## Current security boundary

DriveLens Market Lab is deliberately limited:

- no account or authentication;
- no customer/dealership database;
- no payments, deposits, financing applications or lender integrations;
- no real test-drive booking;
- no persistent image uploads;
- no analytics or advertising;
- no external browser scripts;
- no public mutation API;
- browser-local saved, compare, reservation and admin state;
- optional server-side Gemini image analysis with size/type bounds and no DriveLens retention.

## Secret handling

`GEMINI_API_KEY` must be stored only as a server-side Sensitive Vercel environment variable. Never use `NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`, or another browser-exposed prefix.

Rotate the key immediately if it appears in source, Git history, logs, screenshots, browser network requests, or a public response.

## AI safety boundary

Photo matching may identify only visible, non-sensitive characteristics such as probable body type, colour and visible exterior features. It must not infer or claim:

- VIN or exact identity;
- ownership;
- exact year;
- price;
- mileage;
- title or lien state;
- mechanical condition;
- collision history;
- safety or roadworthiness.

## Future live marketplace

A live vehicle marketplace requires a separate security programme covering verified identities, server-enforced roles, transactional inventory and booking constraints, audit logs, image moderation, storage policies, rate limiting, fraud response, privacy governance, backups, incident response, observability, threat modelling and penetration testing.
