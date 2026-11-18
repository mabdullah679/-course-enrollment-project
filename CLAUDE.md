# course-enrollment-project (CEGM LMS)

Spring Boot 3.3 (Java 17) REST backend + React 18 / Vite / Tailwind frontend for a course-enrollment LMS (roles STUDENT, INSTRUCTOR, ADMIN, STAFF). Global rules: `~/.claude/CLAUDE.md`. Repo facts only below (verified 2026-11-18).

## Commands
- Backend: `cd backend && ./mvnw -B test` needs JDK 17 (host JDK 27 not tried). Verified via Docker: `docker run --rm -v "$PWD/backend:/app" -w /app maven:3.9-eclipse-temurin-17 mvn -B test`. 18 tests, all pass (2026-11-18; was 10/16 before the CI-red fix).
- Run backend: `mvn spring-boot:run` (H2 file db `backend/data/`, port 8080, dev profile). Health: `GET /api/v1/health` (note `/api/health` returns 403).
- Frontend: `cd frontend && npm ci && npm run dev` (port 3000, proxies `/api` to 8080). `npx vite build` passes; `npx tsc --noEmit` passes (7 pre-existing errors fixed 2026-11-18). `npm run lint` has no ESLint config and cannot run.

## Layout
`backend/src/main/java/com/cegm/lms/` (controller, service, model, security, config), `frontend/src/` (pages, components, services), `ssot/` (YAML config + schema read by the backend), `scripts/` (manual shell tests, need a running stack), `docs/` (sprint docs, handoff, QA script), `.githooks/pre-commit`.

## Do not touch / watch for
- Dev credentials are intentionally seeded by `DataSeeder` and dev JWT secrets have committed defaults (`ssot/ssot.dev.yaml`, `application-dev.yml`, `docker-compose.yml`). Never deploy this config as-is.
- Never commit cookie jars or curl output (now gitignored); history still holds some (see PR).
- `docker-compose.yml` (Postgres, `openjdk:21` image) and `scripts/*.sh` were not run in the sanitize pass; the app itself runs on H2.
- Known bug, not fixed: `MetricsController` maps `/api/v1/metriPcs` (typo).
- Branch + PR only; no deploys without the owner.
