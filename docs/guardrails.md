# Guardrails (Security, Ops, and UX Constraints)

## Cookies & Sessions
- Prefix policy:
  - Use `__Host-` only when Secure=true, Path=/, and no Domain (typically HTTPS).
  - For dev HTTP, use a plain cookie name from config; Secure=false, HttpOnly=true, SameSite=Lax, Path=/, no Domain.
- Rotate cookie and server session ID on login and on role change.
- Logout clears cookie (Max-Age=0, Path=/).
- No client pinning: do not restrict a valid session to the original request method or user-agent. GUI/CLI/new window must be able to authenticate independently with valid credentials.

## Public Health
- Permit all: GET /api/v1/health, GET /actuator/health, GET /actuator/info, and all OPTIONS preflight.

## CORS & CSRF
- CORS: allow http://localhost:3000; allow-credentials=true.
- Methods: GET, POST, PUT, DELETE, OPTIONS. Headers: Content-Type, Authorization, X-Requested-With.
- CSRF: disabled for API in dev unless the GUI supplies CSRF tokens.

## API Versioning & Deprecation
- All routes under /api/v1.
- Deprecations require a notice header, changelog entry, and a time window before removal.

## IDOR & Deny-by-Default
- Deny-by-default globally.
- Automated negative tests for cross-user reads/writes across Users, Courses, Enrollments, Grades, Approvals, Exports, Audit.

## Security Headers
- Content-Security-Policy (strict self), Referrer-Policy: no-referrer, Permissions-Policy: geolocation=(),camera=(),microphone=(), X-Content-Type-Options: nosniff, X-Frame-Options: DENY (or CSP frame-ancestors 'none').

## Exports
- Same policy checks as list endpoints; rate-limited; audited; CSV injection sanitized.

## DB Constraints & Seeds
- Uniqueness, non-null FKs, cascades documented, enrollment uniqueness, grade domain.
- Seeds fail fast on constraint violations.

## Backups & Restore (staging/prod)
- Daily backups; quarterly restore drills; RPO/RTO documented.

## Performance & A11y
- Keyset pagination enforced; N+1 detector and query budgets in CI.
- A11y: axe zero critical issues; keyboard path validated.

## Preview Hygiene
- Dev/preview seeds scrub PII; logs/PR artifacts redact PII.
