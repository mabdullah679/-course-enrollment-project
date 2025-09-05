Area	Scenario	What we do	Evidence
Admin Dashboard	Actuator missing	Tiles show Disabled w/ tooltip; no spinner	Screenshot of disabled tiles; console info log
Admin Users	Combined filters	Role + Approved + Active + q applied together	Network request params; table reflects combined filters
Admin Users	Change Role	ROLE chip → modal → PATCH → row updates	HAR showing 2xx with Cookie; screenshot of toast & updated chip
Admin Users	Change Status	STATUS chip → modal → PATCH → row updates	HAR; screenshot
Admin Users	CSV	Export works even if server missing → client CSV	Downloaded users_YYYYMMDD.csv attached
Admin Courses	Create course	Modal validates, POST persists, row appends	HAR + post-create row visible
Admin Courses	Status change	Pill → modal → PATCH → pill updates	HAR + screen
Instructor Gradebook	Assign grade	Modal PUT persists; “pending” badge replaced	HAR + updated row
Student Enrollments	Gating	When window closed: banner + read-only	Screenshot + request to /api/v1/config/meta
Staff Support	Approvals	Page pre-filtered for approved=false	URL w/ query + grid reflects
Profile	Single source	UI reads only from AuthContext; role badge deep-links for Admin/Staff only	Screens
Routing	Guards	Staff/Instructor blocked from /admin/*	Console info log + redirect behavior

Acceptance is green only if all evidence artifacts are provided and requests show Cookie present.