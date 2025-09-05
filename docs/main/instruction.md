Objective

Harden the frontend so every dashboard tile and mini-GUI reads/writes real data against the Spring backend (H2), with correct cookies/CSRF posture, consistent routing, and graceful fallbacks where the backend capability does not exist. Do not modify backend unless this doc explicitly says to expose an endpoint; if an endpoint is missing, mark the tile/CTA Disabled and tooltip “Endpoint unavailable” and log a single info line.

Target topology (local only)

FE: http://localhost:3000

BE: http://localhost:8080

App APIs: /api/v1/*

Actuator-only: /actuator/* (never under /api)

Single shared HTTP client

All protected requests must use one shared client with:

baseURL set from /api/v1/config/meta at runtime (no hardcoded env)

withCredentials: true

CSRF header/cookie wiring only if the backend sets it (don’t invent)

Automatic Accept: application/json and appropriate Content-Type on POST/PUT/PATCH

Cross-cutting GUI rules

Each card/tile has its own Refresh and Execute CTA where relevant. Disable if the endpoint is unavailable. No forever spinners.

Empty states: render structured empty tables with “No data yet” + refresh button; no unhelpful error toasts for 404/empty.

Toasts: use de-dup policy — max one per logical group (auth/api/form/system) within 10s.

Search + filters: apply together (AND), not sequential short-circuiting.

Deep links: brand “CEGM LMS” routes by role; role badges deep-link to Users (only Admin/Staff); Student role badge is not a deep link.

Audit “i” icon: open mini-GUI that lists recorded changes if endpoint exists; otherwise tooltip “Audit trail unavailable”, no error toast.

403 while cookie present on protected POST/PUT/PATCH ⇒ stop work on that feature, surface banner “403 with Cookie: check method security / CSRF” and follow the Stop rules.

What to wire (endpoints)

Back the following UI actions with real calls. If your backend already exposes these paths, use them. If not, mark Disabled + tooltip.

Configuration / Capability

GET /api/v1/config/meta → runtime config (feature flags, enrollment window, UI brand, etc.)

(Optional) GET /actuator/health, GET /actuator/info → if Actuator is present. Never prefix with /api.

Users (Admin & Staff)

List users: GET /api/v1/users?role=&approved=&active=&q=

role in {ADMIN, STAFF, INSTRUCTOR, STUDENT} or absent.

approved boolean (true/false) or absent.

active boolean (true/false) or absent.

q matches name/email/username.

Change role: PATCH /api/v1/users/{id}/role body { "role": "…" }

Change status: PATCH /api/v1/users/{id}/status body { "approved": bool, "active": bool }

Approvals queue (Staff Support): reuse list users with approved=false.

CSV export (if no server export): client-side generate CSV from current filtered dataset and trigger download with file name users_YYYYMMDD.csv.

Courses (Admin & Instructor)

List courses: GET /api/v1/courses

Create course: POST /api/v1/courses body { name, courseCode, credits, status, description }

Change status: PATCH /api/v1/courses/{id}/status body { "status": "ACTIVE|ARCHIVED|DRAFT" }

(Audit) GET /api/v1/audit/courses/{id} if available; else disable the “i”.

Enrollments (Student & Instructor views)

Student list: GET /api/v1/enrollments?studentId=me

Instructor review: GET /api/v1/enrollments?instructorId=me

Enrollment window:

from /api/v1/config/meta: one of:

"enrollmentWindow": "OPEN" | "CLOSED" or

"enrollmentDates": { "start": ISO, "end": ISO }

If closed or outside window, Enrollment actions are read-only with a gating banner.

Grades (Instructor & Student)

Instructor: list gradeable items GET /api/v1/grades?instructorId=me

Assign/update grade: PUT /api/v1/grades/{enrollmentId} body { score, grade, feedback }

Student: GET /api/v1/grades?studentId=me

If any endpoint above does not exist in your backend, do not fake it. Disable UI affordances for that feature with clear tooltip.

Per-page requirements (what the screenshots showed missing)
Admin Dashboard

System Health / Info / Config Meta tiles:

On load, do a one-time capability probe. If actuator endpoints return 404/501/connection error, mark tiles Disabled with tooltip “Endpoint unavailable”. Do not show “Loading…” forever.

Each tile still shows Refresh and Execute:

Refresh: re-probe if enabled; if disabled, no-op + tooltip.

Execute: if not meaningful, no-op + tooltip “No action available”.

User Management & Course Management cards: Manage → navigates to their pages.

Admin → Users

Filters apply together: (role matches OR role not set) AND (approved matches OR approved not set) AND (active matches OR active not set) AND (q matches OR q empty).

ROLE chip = opens mini-GUI to change role → on success, toast “User role updated” and re-fetch list.

STATUS chip (“Approved · Active”) = opens mini-GUI with two toggles; PATCH the deltas; on success, update row live.

Created “i” icon = open Audit mini-GUI; if endpoint missing, tooltip and disable.

Search box filters client-side while also sets q server param on refresh (server authoritative).

Export CSV: if server export fails, do client-side export of current filtered rows. Never toast an error if client export succeeds.

Admin → Courses

Create Course modal requires name, courseCode, credits, status, description. On success, append new row without full-page reload.

STATUS pill hyperlinks to mini-GUI to change status; after success, update in place.

Created “i” icon Audit mini-GUI (disable if unavailable).

Page-level Refresh re-fetches list.

If backend rejects with validation (4xx body), display inline validation hints in modal, not just a toast.

Instructor Dashboard

Cards: Courses, Enrollments, Gradebook, Quick Actions.

Courses page title: “Courses” (not “My Courses”) but list is only courses the instructor teaches.

Gradebook

Table shows “No grades yet” empty state until records exist.

Add Assign Grade CTA in each row where grade is missing → opens modal → PUT /api/v1/grades/{enrollmentId}. On success, show “pending” badge replaced by grade/score.

Refresh should clear error toasts (de-dup) and re-fetch.

Staff Dashboard

Do not reuse Admin Dashboard under /staff. Keep a separate Staff Support page:

Approvals tile → Staff Users view pre-filtered approved=false.

Config tile: only reads /api/v1/config/meta. No actuator here unless allowed.

Health tile: if actuator available, show; else error badge Unknown without spinners.

Data Exports tile: navigates to users view with Export CSV affordance.

Staff Users page has the same Users grid as Admin but no role change to ADMIN. Show tooltip “Admin role changes require Admin privileges.”

Student surfaces

Dashboard cards link to Courses/Grades/Enrollments with Refresh. No edit CTAs except Enrollment actions when window OPEN.

Profile shows status; Student role chip not a deep link.

Routing & Guards

Brand link route by role: ADMIN→/admin, INSTRUCTOR→/instructor, STAFF→/staff, STUDENT/unknown→/dashboard, unauth→/login.

Do not allow Staff/Instructor to access /admin/* routes; redirect to home and log a single info line (“route-guard: blocked path …”).

Instructor/Staff Profile role chip deep-links to Users only for Admin/Staff.

Stop rules (strict)

If a protected request is sent without a Cookie header → STOP, cite the exact file+function that sent it, and fix the client.

If any actuator call includes /api in its path → STOP and correct path.

If a protected POST/PUT/PATCH returns 403 while a Cookie is present → STOP and document that method security/CSRF must be adjusted on the backend; do not add client hacks.

Deliverables

Implement all wiring above.

Evidence bundle:

Screenshots of each page: before vs after for tiles, filters, modals, and empty states.

Console/network capture for at least one successful role change, status change, course create, grade assign (showing Cookie present and 2xx).

One capture showing disabled actuator tiles with tooltip.

CSV file saved from client export (attach).

Grouped diff summary by file with a one-line rationale per file.