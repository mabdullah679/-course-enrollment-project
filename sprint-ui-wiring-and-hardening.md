# Sprint: UI Wiring & Hardening (Admin + Student)

Read with:
- prompt.md
- instruction.md
- guardrails.md
- acceptance-matrix.md
- sprint-gui-auth.md
- sprint-jwt-debug.md
- sprint-student-gui-auth.md
- sprint-multi-client-session.md

Rules
- Do NOT stop existing watch shells; rely on hot reload.
- Frontend origin: http://localhost:3000
- Backend base: http://localhost:8080/api/v1
- No hardcoded values; UI must reflect live backend/DB state.
- Use withCredentials for all requests.

## 0) What we are fixing (from user QA)
Admin:
- Dashboard is not card-based; hamburger-only. No live data.
- Users/Courses/Enrollments/Grades pages show placeholders; not clickable; no real data.
- Cannot approve pending users; cannot change account type/roles.
- Filters (status/pending) & search do not work.
- CSV export does not work.
- Rename “Admin Courses” → **Course Management** (admin orchestration), with a similar handler for **Grades Management**.
- Missing **Configuration** page: live backend/DB health tiles with **mini refresh** (tile-only refresh, no full-page reload).
- Missing **Admin Profile** page.

Student:
- Dashboard has cards, but they are placeholders; not clickable; target pages show no real data.
- Missing **mini refresh** on each data block (reduce full-page reloads).
- Missing **Student Profile** page.

## 1) Route map (must exist and be reachable via cards + hamburger)
- Admin:
  - `/admin` (Dashboard)
  - `/admin/users` (Users Management)
  - `/admin/courses` → **rename to** `/admin/course-management`
  - `/admin/grades` → **rename to** `/admin/grade-management`
  - `/admin/enrollments`
  - `/admin/config` (Configuration: health tiles, DB stats)
  - `/admin/profile`
- Student:
  - `/student` (Dashboard)
  - `/student/courses`
  - `/student/enrollments`
  - `/student/grades`
  - `/student/profile`

Cards on the dashboards must **deep-link** to the corresponding pages and **display live counts** (not placeholder numbers).

## 2) Data wiring (exact endpoints to use)
Auth
- `GET /auth/me` → hydrate role/approval state on every app load and after login.

Users (Admin)
- List: `GET /users?size=&after=&q=&status=&role=`
  - **Keyset** pagination using `after` cursor (no offset).
  - Filters: `status` (PENDING, APPROVED, REJECTED, ACTIVE), `role` (ADMIN, INSTRUCTOR, STAFF, STUDENT).
  - Search `q`: substring on name or email.
- Approve: `POST /users/{id}/approve`
- Change roles: `POST /users/{id}/roles` body: `{ "roles": ["STUDENT" | "INSTRUCTOR" | "STAFF" | "ADMIN"] }`
- Export CSV: `POST /exports/csv` with `{"resource":"users","filters":{...}}`
  - Must enforce same policy as list; rate-limit; sanitized csv (cells starting with =,+,-,@ prefixed with `'`).
  - Return a downloadable blob (UX: toast + download).

Courses
- Admin (Course Management): `GET /courses?ownerId=&term=&status=&size=&after=`
- Student courses: `GET /courses?enrolled=true` OR `GET /enrollments?studentId=<me>` then map to courses.

Enrollments
- Admin: `GET /enrollments?type=&semester=&courseId=&studentId=&size=&after=`
  - “Type” UI control should map to your FSM states; include **Pending**/**Approved**/**Active**/**Completed**/**Rejected`.
  - **Date filter**: support window toggle with **from** ≥ **today** constraint for “upcoming”.
- Student: `GET /enrollments?studentId=<me>`

Grades
- Admin Grade Management (instructor-limited edits still enforced server-side):
  - `GET /grades?courseId=&studentId=&status=`
  - `PUT /grades/{id}` for permitted instructor/course scope only.
- Student grades: `GET /grades?studentId=<me>`

Configuration (Admin)
- Health tiles:
  - Backend health: `GET /health` and `GET /actuator/health` (both public).
  - DB info (if exposed): e.g., a lightweight “counts” endpoint; otherwise show course/user/enrollment totals from existing list APIs.
- Each tile has its **own refresh button** that re-queries only its data.

Profile (Admin & Student)
- At minimum: data from `/auth/me` (email, role(s), approval, createdAt). Future: password change flow (non-blocking this sprint).

## 3) UI behavior rules (must implement)
- **Mini refresh**: Each card/table header has a refresh control that re-executes only that query and shows a small spinner/skeleton on that block.
- **Loading and empty states**: skeleton loaders; “No results” with applied filter badges.
- **Filters**:
  - Users: status and role filters must alter query params and update results.
  - Enrollments: type (FSM states) + optional semester; date fields enforce **today-or-future** for “upcoming”.
- **Search**: debounced (300–400ms), sends `q` param; clears resets results.
- **Action buttons**:
  - Users table: **Approve** (enabled for PENDING), **Change Role** (multi-select roles), **Export CSV** (opens dialog summarizing filters, then POST).
  - Approve success must re-fetch the table (no full page reload).
- **Navigation**: All dashboard cards and menu items are clickable and navigate to the mapped routes.
- **Toasts**: Success and error toasts with server messages. CSRF/CORS handled already; 401 clears session and redirects to login.
- **Responsiveness**: Card grid reflows for ≥1280/≥768/<768 breakpoints (at least three tiers).

## 4) Known pitfalls to avoid
- Do **not** rely on placeholder arrays—always render from API responses.
- Do **not** block GUI if a CLI session exists (multi-session policy stands).
- Do **not** implement offset pagination—use **keyset** with `after`.
- Do **not** display ADMIN-only actions for students; server enforcement remains deny-by-default.

## 5) Admin renames (must)
- Replace “Admin Courses” with **“Course Management”** in nav and route.
- Add **“Grade Management”** for admin.
- Add **“Configuration”** page for health tiles (backend/app/db summaries).

## 6) QA plan (repeatable, no restarts)
Run these in a normal browser (not VS Code webview) **and** in a fresh browser profile:

A. **Navigation & cards**
1. Log in as ADMIN; load `/admin`.
2. Verify a **card grid** with live counts for Users, Course Management, Enrollments, Grade Management, Configuration.
3. Click each card ⇒ lands on the right page; mini refresh works per block.

B. **Users Management**
1. Initial list shows live data (no placeholders).  
2. Filter `status=PENDING` ⇒ table updates; **Approve** button appears for pending rows; approving re-fetches table and moves user to APPROVED/ACTIVE.  
3. Change roles via dialog ⇒ POST `/users/{id}/roles` ⇒ toast + table re-fetch shows updated roles.  
4. Search `q` by email ⇒ list narrows; clearing restores.  
5. Export CSV with current filters ⇒ file download; verify CSV injection sanitization (cells starting with =,+,-,@ are prefixed with `'`).

C. **Course Management & Grade Management**
- Course filters (ownerId/term/status) update results; clicking a course opens a detail drawer/page with participants and dates (if available).
- Grade Management shows grade rows; PUT works only when server scope allows (instructor-limited). UI hides disabled actions when unauthorized.

D. **Enrollments (Admin)**
- Type dropdown filters between states (Pending/Approved/Active/Completed/Rejected).
- “Upcoming” toggle restricts to dates ≥ today; date picker prevents past dates.

E. **Configuration**
- Tiles show `/health` and `/actuator/health` status and/or live counts; each tile refreshes independently without full page reload.

F. **Student flows**
- Student dashboard cards navigate to real pages with live data (Courses, Enrollments, Grades).  
- Each page has a mini refresh; tables show only the student’s scope.  
- Negative test: student attempts to access admin routes ⇒ client blocks; forcing request ⇒ server 403.

G. **Profile pages**
- Admin and Student profile pages render `/auth/me` data and refresh independently.

## 7) Evidence to produce (no source code in chat)
- **Screenshots/HAR**:
  - Admin dashboard card grid with live counts.
  - Users page with `status=PENDING` filter, approving a user, and the re-fetched result.
  - Roles change dialog success and updated roles visible.
  - CSV export: request/response proof and a snippet showing injection-safe prefixing.
  - Course Management and Grade Management pages with real results.
  - Enrollments page showing type filter + upcoming date constraint (screenshot of disabled past dates).
  - Configuration page with health tiles and mini refresh in action.
  - Student pages (Courses/Enrollments/Grades) with real data; mini refresh.
  - Profile pages for admin and student.
- **Text note**:
  - Confirm keyset pagination (show `after=` param used on subsequent requests).
  - Confirm search debouncing and filter query params reflected in the URL (if implemented).
  - Confirm multi-session policy unchanged (GUI/CLI parallel sessions still pass).
- **CSV sample**: attach a short snippet showing sanitized cells.

## 8) Optional: containerized DB?
- **Not required** to fix current wiring/auth. H2 dev is fine for this sprint.
- **Consider Postgres container** later if you want persistence across restarts, larger datasets to test pagination and exports, or closer prod parity. If added, it must not break watch-mode workflows or the existing auth; seed via migrations with scrubbed data.

## 9) Exit criteria (must all be green)
- Every admin/student dashboard card is **clickable** and routes to a **wired page** with **live data** (no placeholders).
- Users page: **approve pending**, **change roles**, **filter by status**, **search**, **export CSV**—all working with re-fetch on success.
- Enrollments, Course Management, Grade Management pages show real results with filters and mini refresh.
- Configuration page shows backend/health with **tile-only refresh**.
- Both profile pages exist and render `/auth/me` data.
- Multi-session behavior unchanged; no regressions in auth/CORS/CSRF/cookies.
