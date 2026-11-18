CEGM LMS (course-enrollment-project)

What it is: a prototype learning-management system for course enrollment. The back end is a Spring Boot API with login by session cookie. The front end is a React website for students, instructors, staff and admins.

What is NOT external: nothing. It runs entirely on your computer with a small built-in file database (H2). No cloud, no email service. The Postgres entry in docker-compose.yml is not what the app uses by default and was not verified.

What you need: Java 17 (or Docker with the maven:3.9-eclipse-temurin-17 image), Node.js 22 with npm, and ports 3000 and 8080 free.

How to run it:
1. Back end: go to the backend folder and run ./mvnw spring-boot:run. The first start creates demo users and courses.
2. Check it: curl http://localhost:8080/api/v1/health should answer with status UP.
3. Front end: go to the frontend folder, run npm ci, then npm run dev, and open http://localhost:3000.
4. Sign in with a demo account: admin@cegm.edu / admin123, student@cegm.edu / student123, or instructor@cegm.edu / instructor123. These are demo-only and are created in DataSeeder.java.
If a port is busy, change it in backend/src/main/resources/application.properties and in frontend/vite.config.ts. The front end proxy must point at the back end port. Do not use /api/health to check health: it answers 403. Use /api/v1/health.

What was observed working against a running back end: logging in with a valid account gives 200 and a session cookie; a wrong password gives 401; reading /api/v1/courses with the cookie gives 200 and without it gives 403. The web pages (student pages, admin pages) exist in the code but were not clicked through in this cleanup.

Main API areas under /api/v1: auth, users, courses, course-assignments, enrollments, enrollment-window, grades, config, exports, metrics, and an open health check.

Tests and their honest state:
- Back end: 16 tests, 10 pass, 6 fail. All 6 failures are in UsersControllerIntegrationTest because the test setup cannot start the Spring context (the app class needs a UserRepository that the web-only test slice does not provide). Not fixed in this cleanup.
- Front end: the vite build works, but the type check (tsc) reports 7 errors about enrollment status values, so npm run build fails today. There is no lint configuration and no UI test suite.
- The GitHub check runs backend compile and tests, front end type check and build, and a secrets scan. Because of the failures above the back end and front end checks are red until those are fixed.
- The shell scripts in the scripts folder need a running system and were not run in this cleanup.

Where things are: backend (Java API), frontend (React site), ssot (one shared YAML config and its schema), docs (handoff notes, future work, QA script, sprint notes), scripts, docker-compose.yml, and .githooks/pre-commit which you can enable with git config core.hooksPath .githooks.

Design choices: the app uses the H2 file database by default because it needs no setup. Demo accounts and development secret keys are committed on purpose for local use, which is exactly why this configuration must never be deployed as it is.
