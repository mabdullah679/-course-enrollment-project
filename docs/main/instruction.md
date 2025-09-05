Sprint Task Map (closing to staging)

Normalize API usage & credentials

All app calls under /api/v1/*; actuator under /actuator/* (if exists).

Every feature module uses the shared HTTP client with credentials. No direct fetch/raw axios.

Brand link routing by role

“CEGM LMS” routes: ADMIN→/admin, INSTRUCTOR→/instructor, STAFF→/staff, else→/student, unauth→/login.

Staff/Instructor must not reach admin pages (guard routes & nav).

Per-tile Refresh & Execute behaviors

Every mini GUI (dashboard card) has its own Refresh button.

Execute buttons must trigger the documented action (probe/fetch/update) and render a visible result or a scoped toast.

No endless spinners. Use capability probe (see §4) and disable if unavailable.

System tiles: capability probe & graceful fallback

On first visit, probe once:

/api/v1/config/meta → hasMeta

/actuator/health & /actuator/info → hasActuator

If any probe 404/500s, set flag false, show Disabled state (tooltip: “Endpoint unavailable”), no polling, no toasts, log once at info.

Admin Users – hardening & mini GUIs

Status filtering: align with backend contract (booleans: approved, active), not enums.

CSV export: works with credentials; response text/csv; sensible filename.

Role column hyperlinks: each ROLE value is a link opening a Role mini GUI (modal/panel) to view/edit role (where permitted).

Status mini GUI: from STATUS column (or Actions menu), toggle Active/Approved when permitted.

Created column: read-only; add Info icon to open an Audit mini GUI showing change log (role/status changes with timestamps).

Actions menu: “Change Role”, “Change Status”, “View Profile”.

Approval flow:

Unapproved users cannot log in (backend behavior).

On denied login due to approved=false, show toast:

“Your account is pending approval for role {role}.”

Only ADMIN can approve/promote/demote ADMIN users; staff/instructor cannot.

Courses – CRUD & status mini GUI

List: name, course code, credits, status, created.

Create Course includes: name*, courseCode*, credits*, status*, description.

Persist to H2 via existing endpoints; append to list on success.

Status hyperlink opens Course Status mini GUI to change status (persist) with a single scoped toast.

Audit Info on Created shows course change history (status changes; timestamps).

Validation errors surface clear field toasts/messages (no generic “Validation failed”).

Grades, Enrollments, Empty states

When no data, show the table headers and an empty state: “No data yet.”

Gradebook navigation from Instructor must not loop back; route to grades page.

One scoped toast per failure; no storms.

Profile page hygiene & deep link

Single data source (Auth context or one fetch).

No “success data + failure toast” combos.

Role badge link opens Users with role pre-filtered.

Student & enrollment window

Student cards are view only except Enrollments.

Enrollments are editable only if enrollmentWindow=OPEN (admin-controlled flag exposed in config/meta or an existing setting endpoint); otherwise show a toast: “Enrollment window is closed.”

Admin UI exposes a simple toggle for this flag if an endpoint exists; otherwise display read-only state.

Toast de-duplication

One toast per logical group per page; repeated Refresh does not spam.

Evidence

Produce all artifacts defined in acceptance-matrix.md.