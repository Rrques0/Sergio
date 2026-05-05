# Security

## Authentication

- Passwords are hashed with Argon2id through `@node-rs/argon2`.
- Credentials login uses rate limiting and lockout metadata.
- Sessions use Auth.js JWT sessions with short max age and update windows.
- Operator/admin accounts are modeled with mandatory 2FA flags. Production rollout should connect the TOTP enrollment and verification UI before granting live operator access.

## Authorization

- RBAC lives in `lib/rbac/permissions.ts`.
- Mutations go through service actions that call `requireActor` or `requireOperator`.
- UI checks are convenience only; service-layer checks are authoritative.

## Multi-Tenancy

- Tenant-scoped models include `tenantId`.
- Service queries use tenant-aware filters.
- Cross-tenant IDs are rejected by lookup.
- Raw SQL is blocked by default via `auditedRawQuery`.

## Uploads

- Uploads are capped at 8 MB.
- Server validates MIME type and magic bytes.
- Images are rotated, resized, stripped of metadata, and re-encoded to WebP.
- Files are written under `PRIVATE_UPLOAD_ROOT`, outside the webroot.
- Access uses tenant-checked authenticated reads or signed URLs.

## Documents And Exports

- PDF content is rendered from typed database records.
- CSV export quotes all cells and prefixes formula-like cells with an apostrophe.
- Customer-facing PDF links can be signed with `SIGNED_URL_SECRET`.

## Audit Logs

Tenant audit logs and operator audit logs are append-only and hash-chained where the application writes them. Covered events include registration, login, customers, jobs, estimates, invoices, expenses, files, QR assets, change orders, and sample job creation.

## Production Checklist

- Set strong `AUTH_SECRET` and `SIGNED_URL_SECRET`.
- Use production PostgreSQL credentials.
- Put uploads on encrypted storage.
- Terminate TLS at a trusted reverse proxy.
- Enable database backups and point-in-time recovery.
- Run secret scanning before commits.
- Rotate sessions after privilege changes.
- Enable TOTP enrollment flow before live operator onboarding.
