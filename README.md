# CEGM LMS (course-enrollment-project)

A course-enrollment learning-management prototype: a Spring Boot REST API with cookie-session (JWT) auth and a React single-page app for students, instructors, staff and admins.

```
browser ──▶ Vite dev server :3000 (React SPA) ──/api proxy──▶ Spring Boot :8080 ──▶ H2 file db (backend/data/)
                                                                   └─ reads ssot/ssot.dev.yaml
```

Nothing external is required: no cloud, no SMTP, no external database (the Postgres service in `docker-compose.yml` is not what the app uses by default; see Design notes).

## Prerequisites

- JDK 17 (the project targets 17; or use Docker with `maven:3.9-eclipse-temurin-17`)
- Node.js 22 and npm (CI uses 22)
- Ports 3000 and 8080 free (change `server.port` in [application.properties](backend/src/main/resources/application.properties) and `server.port`/proxy in [vite.config.ts](frontend/vite.config.ts))

## Run it

1. Backend: `cd backend && ./mvnw spring-boot:run` (first start seeds demo users and courses).
2. Check it: `curl http://localhost:8080/api/v1/health` returns `{"status":"UP",...}`.
3. Frontend: `cd frontend && npm ci && npm run dev`, open `http://localhost:3000`.
4. Seeded admin/student passwords are NOT in the code. Export them before step 1 (see [.env.example](.env.example)); if a variable is unset, that user is not created and a WARN names the variable. Pull the owner's dev values from AWS SSM Parameter Store (us-east-1, SecureString) without printing them:

   ```
   export SEED_ADMIN_PASSWORD="$(aws ssm get-parameter --region us-east-1 --with-decryption --name /mab-site/dev/course-enrollment/admin-password --query Parameter.Value --output text)"
   export SEED_STUDENT_PASSWORD="$(aws ssm get-parameter --region us-east-1 --with-decryption --name /mab-site/dev/course-enrollment/student-password --query Parameter.Value --output text)"
   ```

   Then sign in as `admin@cegm.edu` or `student@cegm.edu` with those values (set in [DataSeeder.java](backend/src/main/java/com/cegm/lms/config/DataSeeder.java) and [DefaultUserInitializer.java](backend/src/main/java/com/cegm/lms/config/DefaultUserInitializer.java)). `instructor@cegm.edu` and the staff/pending demo users still use hard-coded demo passwords in DataSeeder (not yet moved). For docker compose, put the two variables in a local `.env` (gitignored). The `scripts/*.sh` helpers read the same two variables.

If a port is taken, change it in the two files named under Prerequisites; the frontend proxy target must match the backend port. Do not use `/api/health` as a health probe: it returns 403 (only `/api/v1/health` is open).

## What it does

| Action | Result (observed against a running backend, 2026-11-18) |
| --- | --- |
| `POST /api/v1/auth/login` with valid credentials | `200`, sets the `cegm_dev_session` cookie |
| Same with a wrong password | `401` |
| `GET /api/v1/courses` with the cookie | `200` |
| `GET /api/v1/courses` with no cookie | `403` |
| Student pages `/student`, `/student/courses`, `/student/enrollments`, `/student/grades`, `/student/profile` | Routes defined in [App.tsx](frontend/src/App.tsx) (UI not exercised in the sanitize pass) |
| Admin pages (users, courses, enrollments, grades, configuration) | Components exist in [frontend/src/pages/](frontend/src/pages/) (not exercised) |

## Interface

Base paths implemented by the controllers in [backend/src/main/java/com/cegm/lms/](backend/src/main/java/com/cegm/lms/); everything under `/api/v1` needs the session cookie except health and login.

| Base path | Area |
| --- | --- |
| `/api/v1/auth` | login, signup (signup needs admin approval) |
| `/api/v1/users` | user management |
| `/api/v1/courses`, `/api/v1/course-assignments` | courses and instructor assignment |
| `/api/v1/enrollments`, `/api/v1/enrollment-window` | student enrollment and the open/closed window |
| `/api/v1/grades` | grades |
| `/api/v1/config` | SSoT-driven configuration |
| `/api/v1/exports`, `/api/v1/metrics` | exports and metrics |
| `/api/v1/health` | open health check |

## Tests

- Backend: `cd backend && ./mvnw -B test` (or the Docker command in [CLAUDE.md](CLAUDE.md)). 18 tests, no external services. **Current result: 18 pass** (2026-11-18). `UsersControllerIntegrationTest` is a `@WebMvcTest` slice that imports the real `SecurityConfig` and `RequestInterceptorConfig` (slices skip `@Configuration` classes) and mocks the other web-layer collaborators.
- Frontend: `npx tsc --noEmit` and `npx vite build` pass. There is no ESLint config, so `npm run lint` cannot run. No UI test suite exists.
- CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs backend compile + tests, frontend type-check + build, and gitleaks.
- [scripts/](scripts/) holds manual shell tests against a running stack; they were not run in the hygiene pass.

## Layout

| Path | Role |
| --- | --- |
| [backend/](backend/pom.xml) | Spring Boot API (Java 17) |
| [frontend/](frontend/package.json) | React + Vite SPA |
| [ssot/](ssot/ssot.dev.yaml) | Single-source-of-truth config and its [JSON schema](ssot/ssot.schema.json) |
| [docs/](docs/handoff.md) | Handoff, [future work](docs/FutureWork.md), [QA script](docs/qa-script.md), sprint docs |
| [scripts/](scripts/) | Manual smoke/API scripts |
| [docker-compose.yml](docker-compose.yml) | Postgres + backend + frontend containers (unverified) |
| [.githooks/pre-commit](.githooks/pre-commit) | Local secret/localhost checks (enable with `git config core.hooksPath .githooks`) |

## Design notes

- H2 file database by default (`spring.datasource.url=jdbc:h2:file:./data/cegmdb`), not Postgres: zero setup for a prototype. The compose file's Postgres service does not match this default and was not verified.
- Demo accounts and dev JWT secrets are committed on purpose for local use; this is why the config must never be deployed unchanged.
