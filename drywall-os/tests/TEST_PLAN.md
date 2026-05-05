# Test Plan

## Unit

- CSV export escapes spreadsheet injection prefixes.
- Estimate math uses integer cents for subtotal, markup, tax, total, and deposit.
- Future additions should cover RBAC permissions, tenant guards, signed URL verification, and upload MIME/magic-byte validation.

## Integration

- Register owner and tenant.
- Create customer, job, estimate, invoice, expense, material, crew member, change order, QR asset, and audit logs.
- Verify tenant-scoped queries cannot read records from another tenant.

## E2E

- English registration page renders.
- Spanish login page renders.
- Full local milestone flow should run against PostgreSQL with seeded env values: register, create profile, customer, job, estimate PDF, invoice PDF, expense CSV, photo upload, invoice QR, dashboard, and operator metrics.
