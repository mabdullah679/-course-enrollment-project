Users page (Admin & Staff)

Filter bar produces one consolidated API call with all applied params. Update the grid with the response; apply client search on top while typing, then refresh server with q on submit.

ROLE and STATUS chips open modals; submit PATCH; update the row on success; no full reload.

Actions menu: Change Role, Change Status, View Profile. Staff cannot set role=ADMIN (disable + tooltip).

Courses

Modal fields: required: name, courseCode, credits, status; optional: description.

After create: close modal, optimistic row append; reconcile with server on next refresh.

Status change: patch and update in place.

Gradebook (Instructor)

Show pending badges where grade missing.

“Assign Grade” opens modal; PUT /api/v1/grades/{enrollmentId}; update row.

Staff Support

“Approvals” deep-links to Users with approved=false.

“Data Exports” deep-links to Users with Export CSV visible.

Actuator/Config tiles

One-time probe at mount; mark Disabled if not reachable; Refresh retries probe.

Toasts & errors

Validation errors: inline under fields.

5xx: single toast in “api” group; no repeated storms on refresh.