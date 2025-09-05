Roles → Allowed surfaces & actions

Admin: Admin Dashboard, Users (full), Courses (full), Profile.

Staff: Staff Dashboard, Staff Users (no Admin role promotion), Staff Support, Profile.

Instructor: Instructor Dashboard, Courses (only mine), Gradebook (assign grade), Enrollments (read), Profile.

Student: Student Dashboard, Courses/Grades/Enrollments (read; enrollments gated by window), Profile.

Common auth mechanics

On load, fetch /api/v1/config/meta → set baseURL, flags, and enrollmentWindow.

Protect all non-public routes; redirect unauthorized users with a single info log.

Cookies must travel automatically with each request; no manual header injection.