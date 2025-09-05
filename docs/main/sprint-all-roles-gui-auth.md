Common rules (apply to all roles)

All app APIs use /api/v1/* via the shared client with credentials.

Capability probe on entry sets hasMeta and hasActuator; tiles render values or Disabled (no spinners).

Route guards enforce access: only ADMIN reaches admin pages.

Empty states: tables render headers + “No data yet.”

One toast per logical group; no storms.

Admin

Dashboard: system tiles (meta/health/info), Users, Courses, Enrollments, Grades, Quick Actions.

Users page UX: ROLE and STATUS hyperlinks open mini GUIs; Created Info shows audit; Actions menu includes Role/Status/View Profile. Filters use approved/active booleans; CSV export works.

Courses UX: Create (name, courseCode, credits, status, description); Status mini GUI; Created Info audit.

Enrollment window toggle (if endpoint exists); otherwise show read-only state.

Staff

Dashboard: System Health/Info, Config Meta (read-only if endpoints absent), Approvals (non-admin scope), Data Exports (non-admin scope), Quick Actions.

Access control: cannot open admin-only actions (e.g., approve/promote ADMIN). Attempts show a single scoped toast and no route leaks.

Instructor

Dashboard: My Courses, Enrollments by Course, Gradebook, Quick Actions.

Gradebook: routes to grades page (no loops). Empty gradebook shows table + “No grades yet.”

No admin controls visible.

Student

Dashboard: Courses (view), Grades (view), Enrollments (guarded by enrollmentWindow).

Enrollments: editable only when enrollmentWindow=OPEN; else toast: “Enrollment window is closed.”

No privileged controls or admin/staff actions visible.

Evidence (per role)

Role dashboard screenshot after capability probe settles (values or Disabled).

Attempted forbidden navigation (for non-admin) shows block/redirect.

At least one successful protected request in Network with Cookie.

For Admin: Users/Courses mini GUIs and persisted change evidence; CSV download; filters using booleans.