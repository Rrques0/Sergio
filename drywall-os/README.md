# Drywall OS

Production-grade business platform for `[FRIEND'S DRYWALL LLC NAME]`.

Core promise: **Estimate faster. Track every job. Invoice professionally. Get paid faster.**

## What Ships In Milestone 1

- English and Spanish App Router routes with `next-intl`.
- Owner registration/login with Argon2id password hashing.
- Tenant and business profile onboarding.
- Customer management.
- Drywall-specific jobs with workflow status, board type, finish level, texture, and job details.
- Estimate builder with drywall line items, markup, tax, deposit, and PDF export.
- Estimate-to-invoice conversion and invoice PDF export.
- Expense logging with receipt photo upload and CSV export.
- Before/after job photo upload with server-side image validation and re-encoding.
- Basic invoice QR code generation.
- Materials tracker foundation.
- Crew member and assignment foundation.
- Change order module with approval gating before invoice impact.
- Owner dashboard and reports.
- Separate `/operator` console for Standard Automata admin metrics.
- Prisma schema, seed script, Docker production files, and tests.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set real secrets:

```bash
cp .env.example .env
```

3. Start PostgreSQL and Redis. The production compose file can be used locally:

```bash
docker compose -f docker/docker-compose.prod.yml up postgres redis
```

4. Run migrations and seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000/en/register`.

## Verification

```bash
npm run prisma:generate
npm run typecheck
npm run test
npm run test:e2e
```

The E2E suite expects a running app and database for the full milestone flow. The initial committed test verifies English and Spanish entry routes render.

## Architecture Notes

- Service-layer actions enforce auth, RBAC, and tenant scope before mutations.
- Money is stored in integer cents.
- Customer documents are generated with `@react-pdf/renderer`.
- CSV export neutralizes spreadsheet formula injection.
- Uploads validate MIME type and magic bytes, strip EXIF by re-encoding through Sharp, and store outside webroot.
- QR codes use signed PDF URLs so customer-facing links do not require back-office sessions.
- Raw SQL is forbidden outside an audited allowlist helper.

## Operator Access

Run the seed script to create `operator@standardautomata.local`. If `SEED_OPERATOR_PASSWORD` is not set, the seed prints a generated password once.

Operator routes live under:

```text
/{locale}/operator
```

Operator auth is separated from the customer dashboard by role checks for `STANDARD_AUTOMATA_ADMIN`.
