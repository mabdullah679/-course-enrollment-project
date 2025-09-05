Read and obey only the docs in docs/main/* listed below. Frontend only. Localhost FE :3000 ↔ BE :8080. App APIs /api/v1/*. Actuator /actuator/* only. Use one shared HTTP client with credentials for every protected request. No hardcoded env — read runtime config from /api/v1/config/meta.

Implement and wire, per the docs:

Admin/Staff/Instructor/Student dashboards & pages

Users grid (combined filters, role/status modals, CSV fallback)

Courses (create, status mini-GUI, audit icon policy)

Instructor Gradebook (assign grade)

Enrollment window gating from config meta

Capability probes with per-tile Refresh/Execute; no forever spinners

Routing guards + brand link routing

Empty states + toast de-dup + inline validation

Stop rules: if a protected request lacks Cookie; if any actuator path includes /api; or if a protected POST/PUT/PATCH returns 403 while Cookie is present. In each case, STOP and cite the exact file+function and doc section you’re adhering to.

Deliver: working UI, evidence bundle from acceptance-matrix.md, and a grouped diff summary by file with one-line rationale. Work in small chunks: propose plan + file list, then apply.

Docs to load as context:

docs/main/instruction.md

docs/main/guardrails.md

docs/main/acceptance-matrix.md

docs/main/sprint-all-roles-gui-auth.md

docs/main/sprint-ui-wiring-and-hardening.md

docs/main/sprint-jwt-debug.md

docs/main/sprint-config-and-actuator.md

docs/main/sprint-admin-dashboard.md

docs/main/sprint-users-management.md

docs/main/sprint-courses-management.md

docs/main/sprint-instructor-gradebook.md