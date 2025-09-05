A) Brand routing & guards

Implement role routing; guard admin routes from staff/instructor.

Accept: screenshots and blocked attempt.

B) Dashboards & per-tile controls

Admin/Instructor/Staff/Student dashboards render.

Each card has its own Refresh; Execute performs the action (or scoped toast).

Accept: close-ups + Network.

C) System tiles (meta/actuator)

Probe once; render values or Disabled.

Accept: probe captures + Disabled UI (if absent).

D) Admin Users UX

ROLE hyperlink → Role mini GUI; STATUS hyperlink → Status mini GUI; Created Info → Audit mini GUI.

Actions menu: Change Role, Change Status, View Profile.

Filters: approved/active booleans; CSV export works.

Accept: modals/screenshots, filtered request, CSV.

E) Courses UX

Create Course includes code/credits/status/name/description; persists in H2.

Status hyperlink → mini GUI; Audit Info persists.

Accept: submit + list + audit screenshots.

F) Grades/Enrollments/Empty states

Tables render headers + “No data yet”; no looping routes.

Accept: screenshots.

G) Profile hygiene & deep link

One data source; no error toast.

Role badge → Users with role prefilter.

Accept: network and screenshots.

H) Toast hygiene

One toast per group; Refresh All doesn’t flood.

Accept: before/after comparison.

I) Regression pass

Re-verify /api/v1/* + Cookie; actuator only if present; all acceptance items green.