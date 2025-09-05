Evidence QA must capture
Area	Expected	Evidence
API usage & cookies	Protected calls hit /api/v1/* with Cookie present.	DevTools capture (GET + POST).
Actuator routing	/actuator/health & /actuator/info used only if present; otherwise Disabled tiles.	Probe capture + Disabled UI.
Capability probe	One-time probe; no endless spinners; no toasts.	Network (single probe) + UI.
Brand link routing	Brand sends to /admin /instructor /staff /student or /login.	Screens per role/unauth.
Route guards	Staff/Instructor blocked from admin pages.	Attempt screenshot → blocked.
Per-tile Refresh/Execute	Each card has own Refresh; Execute performs or shows scoped toast.	Close-up + Network.
Profile hygiene	Single data source; no error toast.	Network (one call) + UI.
Profile deep link	Role badge → Users prefiltered by role.	Before/after screens.
Users filters	Query uses approved/active booleans; results filter.	URL + list screen.
Users CSV	text/csv download with credentials.	Network + file.
Users mini GUIs	Role link → Role mini GUI; Status link → Status mini GUI; Created Info → Audit mini GUI; Actions includes Role/Status/View Profile.	Modal screens + persisted change.
Course form	Create with name, code, credits, status, description; persists; appears in list.	Submit Network + list.
Course mini GUI	Status change persists; audit visible.	Modal + Info.
Empty states	Grades/Enrollments show headers + “No data yet.”	Screens.
Student enrollment window	Edit only when enrollmentWindow=OPEN; else toast.	Two screens + Network.
Toast hygiene	One per group; no storms.	Before/after.