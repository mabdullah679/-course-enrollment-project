# Acceptance Matrix

Security Headers
- CSP, Referrer-Policy, Permissions-Policy, X-Content-Type-Options, and frame-ancestors/X-Frame-Options present in dev and staging.

Public Health
- /api/v1/health and /actuator/health return 200 unauthenticated.

IDOR Negatives
- Automated negative tests for cross-user reads/writes across Users, Courses, Enrollments, Grades, Approvals, Exports, Audit: zero passes.

Session Fixation
- Cookie/session IDs rotate on login and on role change.

API Contract
- All routes under /api/v1; deprecations announced with notice window.

Exports
- Policy-checked, rate-limited, CSV-injection sanitized, audited.

DB Constraints
- Uniqueness and FK constraints validated in migrations/seeds; seeds fail fast on violations.

Backups & Restore
- Restore drill passes under documented RTO (staging/prod scope).

Performance
- Keyset pagination and per-endpoint query budgets enforced in CI; PRs fail on exceed.

Accessibility
- axe scan has zero critical issues across Users, Courses, Enrollments, Grades, Approvals; keyboard path verified on 5 core flows.

Preview Hygiene
- No PII appears in dev logs, exports, or PR artifacts.

GUI Auth Sprint (this sprint)
- Cookies set on GUI login and preserved; /auth/me returns 200.
- GUI signup returns 200; admin can approve; student can log in from GUI.
- Three full CLI auth cycles pass in the same build (no restarts).
Multi-Client Sessions
- GUI + CLI parallel sessions for the same account both return /auth/me=200 with distinct cookies (no restarts).
- First GUI login after an existing CLI session succeeds with Set-Cookie and /auth/me=200.
- Second browser session/profile can also log in concurrently; both GUI sessions access permitted routes.
