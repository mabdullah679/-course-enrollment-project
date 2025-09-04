# Sprint: GUI Authentication & Signup Stabilization

Scope
- Keep existing watch shells running. Do NOT stop or restart manually.
- Backend and frontend auto-reload via watch/devtools.
- APIs under /api/v1. No hardcoded values.
- Frontend origin is http://localhost:3000 (not 5173).

Symptoms To Fix
- GUI login and signup fail (401/403), while some CLI flows pass.
- Causes to resolve: secrets/cookie-name not resolved at runtime, CORS origin mismatch (must be 3000), CSRF applied to API, cookie attributes incompatible with HTTP dev, form/DTO mismatch (email + password + accountType).

Decisions
- Public Health: GET /api/v1/health, /actuator/health, /actuator/info unauthenticated, return 200.
- Dev HTTP cookies: Secure=false, HttpOnly=true, SameSite=Lax, Path=/, no Domain; no `__Host-` prefix in this mode.
- HTTPS cookies (future): `__Host-` with Secure=true, Path=/, no Domain.

A) Backend Configuration (no manual restart)
1) Secrets & Cookie Name (config-driven)
- In the active dev profile (e.g., application-dev.yml), set:
  - auth.jwt.adminSecret: "<≥32 chars>"
  - auth.jwt.studentSecret: "<≥32 chars>"
  - auth.cookie.name: "cegm_dev_session"
- Save to trigger Spring devtools auto-restart. Verify logs show resolved values (no ${VAR:?missing}).

2) Security Chain
- permitAll: GET /api/v1/health, GET /actuator/health, GET /actuator/info, POST /api/v1/auth/login, POST /api/v1/auth/signup, and all OPTIONS /**.
- Ensure matchers are relative to the servlet context (no /api/api duplication).
- CSRF: disabled for API in dev unless GUI sends CSRF tokens.

3) CORS
- Allowed origin: http://localhost:3000
- allowCredentials=true; methods GET,POST,PUT,DELETE,OPTIONS; headers Content-Type, Authorization, X-Requested-With.

4) Cookie Attributes (dev HTTP)
- Name from config (auth.cookie.name).
- Attributes: Secure=false, HttpOnly=true, SameSite=Lax, Path=/, no Domain.
- On login and role change: rotate server session ID and reissue cookie.

5) Seed Admin
- Ensure startup creates an APPROVED admin (admin@cegm.edu, bcrypt password), preventing H2 deadlock.

B) Frontend Adjustments
6) Axios Client
- baseURL → http://localhost:8080/api/v1
- withCredentials=true globally.
- 401 interceptor: clear client session state and prompt re-login; no loops.

7) Auth Forms & DTOs
- Login body: { "email":"...", "password":"..." } (no username field).
- Signup body: { "firstName","lastName","email","password","accountType" }.
- Signup UI must include accountType or rely on a server default to STUDENT.

8) AuthContext Flow
- After login success, immediately call GET /auth/me to hydrate UI.
- Listen to BroadcastChannel('auth') for role change events; refetch /auth/me.

C) Repeatable Verification (no restarts)
All examples assume http://localhost:8080 and http://localhost:3000.

1) Health (public)
- curl -i http://localhost:8080/api/v1/health → expect 200, JSON { "status": "UP" }.

2) CLI Auth Cycle (run 3 times in same build with different emails)
- Admin login (expect 200 + Set-Cookie: cegm_dev_session)
  curl -i -c admin_cookies.txt -H "Content-Type: application/json" \
    -X POST http://localhost:8080/api/v1/auth/login \
    --data '{"email":"admin@cegm.edu","password":"admin123"}'
- Me (admin) → 200
  curl -i -b admin_cookies.txt http://localhost:8080/api/v1/auth/me
- Signup student → 200
  curl -i -H "Content-Type: application/json" \
    -X POST http://localhost:8080/api/v1/auth/signup \
    --data '{"firstName":"Alice","lastName":"New","email":"alice1@example.com","password":"student123","accountType":"STUDENT"}'
- List users to get ID → 200
  curl -i -b admin_cookies.txt "http://localhost:8080/api/v1/users?size=5"
- Approve student → 200
  curl -i -b admin_cookies.txt -X POST http://localhost:8080/api/v1/users/<ID>/approve
- Student login + me → 200/200
  curl -i -c student_cookies.txt -H "Content-Type: application/json" \
    -X POST http://localhost:8080/api/v1/auth/login \
    --data '{"email":"alice1@example.com","password":"student123"}'
  curl -i -b student_cookies.txt http://localhost:8080/api/v1/auth/me

Repeat with alice2@ / alice3@ in the same build.

3) GUI Flow (browser)
- Admin login from UI → Network shows Set-Cookie; subsequent /auth/me → 200; dashboard shows admin role and live counts.
- GUI signup STUDENT → 200.
- Admin approves; student logs in from UI → student-scoped pages load.
- If preflight fails, confirm Access-Control-Allow-Origin includes http://localhost:3000 and Access-Control-Allow-Credentials: true.

D) Evidence To Produce
- The three CLI cycles (status lines + Set-Cookie on admin login).
- GUI Network traces (Set-Cookie on login; Cookie on /auth/me).
- One-paragraph note confirming public health and admin dashboard role gating.

Exit Criteria
- Health endpoints public and return 200.
- GUI cookies created on login and preserved; /auth/me returns 200.
- GUI signup returns 200; approval and subsequent student login succeed.
- Three CLI auth cycles pass without restarts.
- No CORS/CSRF 401/403 on login/signup.
