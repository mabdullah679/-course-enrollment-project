# Functional Instructions

## 0. Tech Context
- Backend: Spring Boot 3.x, Java 21, JPA/Hibernate.
- Dev database: H2 in-memory (resets on restart). Production/Staging may use PostgreSQL.
- Frontend: React + Vite, Axios.
- Dev URLs: backend http://localhost:8080, frontend http://localhost:3000.
- All API routes are versioned under `/api/v1`.

## 1. Auth, Sessions, Cookies
- Cookie storage: HttpOnly cookies for auth in dev and prod.
- Dev HTTP:
  - When using plain http://localhost, set cookies with Secure=false, HttpOnly=true, SameSite=Lax, Path=/, no Domain. Do not use `__Host-` in this case.
- HTTPS profiles:
  - When HTTPS is enabled, use `__Host-` with Secure=true, Path=/, and no Domain (fallback to `__Secure-` only if Domain is required).
- On successful login and on role change, regenerate the server session identifier and rotate the cookie.
- Logout must clear the cookie with Max-Age=0 and Path=/.

### Multi-Client Sessions (dev)
- Each successful login (GUI or CLI) issues an independent session for that client; sessions are not globally exclusive.
- Do not bind tokens to User-Agent or IP. Credentials → session; origin/source must not block.
- TTL per config; on expiry, valid credentials create a new session immediately.
- Logout ends only the caller’s session unless an explicit “logout all” exists.


## 2. Roles, Authorization, IDOR
- Roles: ADMIN, INSTRUCTOR, STAFF, STUDENT.
- Deny-by-default on all APIs. Controllers must enforce explicit authorization.
- Prohibit IDOR: add negative tests for cross-user reads/writes (Users, Courses, Enrollments, Grades, Approvals, Exports, Audit).

## 3. Role Change Propagation
- On role changes, rotate cookie/session ID, invalidate server cache, and broadcast a client event so all tabs refetch `/auth/me` within 1 second without refresh loops.

## 4. API Contract (minimum)
Auth
- POST /auth/signup body: { firstName, lastName, email, password, accountType }
- POST /auth/login body: { email, password }
- POST /auth/logout
- GET /auth/me

Users (admin)
- GET /users?size=&after=&q=
- POST /users/{id}/approve
- POST /users/{id}/roles

Courses
- CRUD + filters: ownerId, term, status, keyset pagination.

Enrollments
- GET /enrollments?type=&semester=&courseId=&studentId=
- State machine: PENDING→APPROVED→ACTIVE→COMPLETED or PENDING→REJECTED.

Grades
- GET /grades?courseId=&studentId=&status=
- PUT /grades/{id} (instructor limited to own courses)

Exports
- POST /exports/csv (policy-checked, rate-limited, sanitized, audited)

## 5. Admin GUI (dynamic, card-based)
- Responsive grid of live cards (no fixed sizes).
- Each card: live counts, quick filters, View/Create/Export (if allowed).
- Clicking opens a focused detail view.

## 6. Errors & Validation
- Error shape: { timestamp, path, status, code, message, details[] }.
- Field-level errors populate details[] with { field, reason }.
- Frontend shows actionable toasts.

## 7. Public Health Endpoints
- Backend: GET /api/v1/health, GET /actuator/health, GET /actuator/info are unauthenticated and return 200.
- Frontend: a simple /health or /_status is public.

## 8. CORS & CSRF
- CORS (dev): allow http://localhost:3000 with credentials.
- Methods: GET, POST, PUT, DELETE, OPTIONS. Headers: Content-Type, Authorization, X-Requested-With.
- CSRF: disabled for API in dev unless the GUI sends CSRF tokens.

## 9. Data Export Controls
- Apply same policy checks as list endpoints.
- Rate limit and audit all exports.
- CSV injection sanitization: if cell begins with = + - @, prefix with '.

## 10. Database Integrity
- Unique users.email; non-null FKs; documented cascades.
- Grades 0..100, half-up rounding to 1 decimal if needed.
- Enrollment uniqueness per student+course+term.
- Seeds fail fast if constraints break.

## 11. Backups & Restore (staging/prod)
- Daily backups; quarterly restore drill; documented RPO/RTO.

## 12. Performance & A11y
- Keyset pagination on lists.
- CI: N+1 query detector and per-endpoint query budgets; fail PRs on exceed.
- A11y: axe scan 0 critical issues on Users, Courses, Enrollments, Grades, Approvals; keyboard path validated for 5 flows.

## 13. Frontend Integration
- Axios: withCredentials=true globally, baseURL points to /api/v1.
- Interceptor: on 401, clear client state and prompt re-login; no loops.
- After login success, call GET /auth/me; listen to BroadcastChannel('auth') for role changes.

End.
