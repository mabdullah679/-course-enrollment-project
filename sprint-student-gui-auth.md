# Sprint Add-On: Student GUI Authentication & Dashboard Access

Read with:
- prompt.md
- instruction.md
- guardrails.md
- acceptance-matrix.md
- sprint-gui-auth.md
- sprint-jwt-debug.md

Rules:
- Keep current watch shells running (backend, frontend). Do NOT stop or restart them; rely on auto-reload.
- Frontend origin: http://localhost:3000
- Backend base: http://localhost:8080/api/v1
- No hardcoded values; UI must reflect live backend/DB state.

## 1) Target Symptoms
- Admin GUI login works (including VS Code webview).
- Student GUI login appears to succeed or sets cookie, but **student cannot access student dashboard** (redirect loops, 401/403, or blank).
- CLI cycles for student succeed.

This indicates a **frontend role/route guard mismatch** or **per-role API scope mismatch** rather than core JWT/CORS/cookie issues.

## 2) Hypotheses (Check in Order)
H1. **Role string mismatch in the frontend**  
- Backend returns `role: "STUDENT"` (or authorities like `"ROLE_STUDENT"`), but UI guard expects a different string (e.g., `"student"`, `"ROLE_student"`, `"Student"`).  
- Same issue may exist in menu visibility, route guards, or context hydration code.

H2. **AuthContext hydration gap**  
- Login sets cookie, but UI does not refetch `/auth/me` immediately (or reuses stale state) → guards think unauthenticated or wrong role.

H3. **Feature flag / route config mismatch**  
- Student routes are accidentally gated behind ADMIN checks or missing `"STUDENT"` in allowed list.

H4. **Backend student endpoints authorized but front-end pathing wrong**  
- Frontend calls a student-only API with an incorrect path (missing `/api/v1` or different resource name) leading to 404 → UI treats as 401/403.

H5. **VS Code Webview side-effect**  
- Webview runs with a special origin and different cookie handling. Browser at `http://localhost:3000` may be stricter. If admin works in both places, but student only fails in browser, it suggests **frontend-only guard logic**, not transport.

H6. **Account not approved / wrong status**  
- Student created but not approved in GUI test (CLI was approved). Ensure GUI flow fetches fresh approval status.

## 3) Mandatory Instrumentation (Temporary, Dev Only)
Add observable logs (console + network capture) without changing behavior:
- **Frontend console**: When AuthContext hydrates, log: `auth.me = { id, email, role, approved }`.
- **Route guard**: Log each navigation decision: `route=/student, role=..., approved=..., decision=ALLOW|BLOCK`.
- **Menu visibility**: Log computed flags for “Student Dashboard” item.
- **Network**: Capture `/auth/me` request/response after login and on first app load.

## 4) Verification Data Model (Contract Snapshots)
On a successful student login:
- `GET /auth/me` returns:
  ```json
  {
    "id": "<uuid|id>",
    "email": "alice@example.com",
    "role": "STUDENT",
    "approved": true,
    "active": true
  }
Frontend must store exactly what backend returns (no lowercasing, no prefix strip/add), and guards must compare against a single source of truth (e.g., user.role === 'STUDENT').

5) Route Guard Normalization (Logic Only)

Single authority check for student area:

ALLOW: if user is defined AND user.approved === true AND (user.role === 'STUDENT' OR user.roles?.includes('STUDENT') OR user.authorities?.includes('ROLE_STUDENT')).

BLOCK: otherwise.

Do not transform the role string in the guard; normalize at one point in AuthContext (e.g., provide auth.hasRole('STUDENT') helper).

After login success, force a fresh GET /auth/me and only then evaluate guards.

On 401 from any guarded fetch: clear session, show toast, and send to /login (no infinite loops).

6) Student API Surface Sanity (No Code—Just Checks)

Ensure these calls exist and are authorized server-side for STUDENT (deny-by-default still applies):

GET /courses?enrolled=true (or equivalent) returns only this student’s enrollments.

GET /enrollments?studentId=<me> is permitted for the logged-in student.

GET /grades?studentId=<me> returns only their grades.

If a call is instructor-only, the UI must not call it on a student dashboard; show a user-friendly message if needed.

If a particular student endpoint is 403 from backend:

That’s correct enforcement. Fix the UI to call the right student-scoped endpoint, not the instructor/admin one.

7) Repro & Diagnose (No Restarts)

Perform all steps in both the VS Code webview and a normal browser (Chrome/Edge/Firefox).

A. Fresh student flow

Clear site cookies in the browser.

Sign up a new user as STUDENT via GUI (or use one from the 3 CLI cycles, already approved).

Login as that student in GUI.

Validate:

Network: login response has Set-Cookie for session.

Immediately after login, UI fires GET /auth/me → 200 with role: STUDENT, approved: true.

Console logs show guard decision ALLOW for /student routes.

Student dashboard renders without 401/403.

B. Role toggle sanity (admin → student)

In a separate tab, log in as admin and do not change any secrets or restart servers.

In the student tab, refresh; ensure cookie/session still valid and /auth/me returns student.

Student dashboard still accessible; no cross-tab confusion. If not, ensure BroadcastChannel listeners are not over-zealous (they should only react on explicit role change events).

C. Negative checks

Navigate to admin routes while logged in as student → guard blocks client-side, and server 403 remains if forced.

Attempt to call an instructor-only endpoint from student dashboard (if accessible via UI button by mistake) → fix UI to hide the control; server should 403.

8) Fix Plan (Logic/Config—No Code in this file)

Normalize roles in AuthContext: expose hasRole('STUDENT'), isApproved().

Hydration order: after successful login, always refetch /auth/me before routing decisions.

Route guards: switch to helper-based checks and log decisions.

Menu gating: same helpers determine visibility. Remove duplicated string comparisons scattered across components.

Endpoint mapping: audit student dashboard data calls; replace instructor/admin APIs with student-scoped ones when needed.

Status checks: block until approved === true. If not approved, display explanatory toast and prevent route entry.

Remove string transformations: no lowercasing or adding/removing ROLE_ in component code. Do it once (if needed) in AuthContext mapping.

9) Deliverables

Provide the following evidence artifacts (no source code in the chat):

Console log excerpts showing:

auth.me object (id, email, role, approved) immediately after login.

Route guard decision logs for the student dashboard route.

Network panel screenshots/HAR snippets for the GUI showing:

Login request/response with Set-Cookie.

Subsequent GET /auth/me with Cookie header and 200.

First student data fetch endpoint with 200 (or the corrected endpoint if previously miscalled).

One-paragraph analysis stating exactly which hypothesis (H1–H6) was true and what you changed (e.g., “guard expected 'student' while backend returned 'STUDENT'; normalized via hasRole() helper”).

Negative test evidence:

Attempt to load an admin-only route as student → client blocks + server 403 on forced hit.

No-restart confirmation:

A short note that all fixes applied via watch mode; no manual server restarts performed.

10) Exit Criteria

Student can log in via GUI; /auth/me returns 200, and student dashboard loads with correct data.

Route guards allow student routes and block admin/instructor routes for students.

No infinite redirects or blank screens.

VS Code webview and normal browser both pass the same checks.

Acceptance-matrix “GUI Auth Sprint” items remain green.


---
