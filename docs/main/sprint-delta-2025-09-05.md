Sprint Delta — 2025-09-05

Why: Close gaps found in UXR and finish wiring for staging readiness.

Admin — Users

ROLE/STATUS chips open mini GUIs; changes persist to backend; list updates in place.

Filters combine: Approved (true/false/all), Active (true/false/all), Role (enum/all).

Search matches name/email/username.

CSV: implement with credentials + sensible filename (users-YYYYMMDD.csv) or disable with tooltip “Disabled in dev” + console info.

Admin — Courses

Create dialog with name*, courseCode*, credits*, status*, description.

Status chip mini GUI persists change.

View/Edit dialog (where supported); otherwise read-only with “not available” note.

Audit: show log if present; otherwise display “No audit available”.

Admin — Dashboard

Each functional tile has Refresh and Execute.

Missing capability shows disabled state + tooltip + single info log (no error toast).

Quick Actions: run an observable no-op (e.g., log + subtle UI tick) if no backend.

Instructor

Gradebook: “Assign Grade” flow entry; show Pending badges; NOP if backend absent with info log.

Staff

Real Support page: Approvals / Exports / Config / Health. Not an Admin clone. Guard from admin-only routes.

Student

Enrollments: robust empty/error states; window gating from /api/v1/config/meta.

Grades: empty state is rendered cleanly.

Polish

Student role chip color uplift (not gray).

All promised buttons: real or NOP + tooltip + single info log.

STOP reminders: cookie missing on protected call; actuator path includes /api; protected POST 403 with cookie present.

Deliverables: grouped diff by file + acceptance evidence.