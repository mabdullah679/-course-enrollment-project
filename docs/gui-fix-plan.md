Exact changes the agent must make

Do not stop the running terminals. Edits must rely on watch mode. For backend, edit application-dev.yml (or your active dev profile) to trigger a devtools auto-restart, not a manual kill.

A) Secrets and cookie name, without stopping the backend shell

Inject secrets via config file, not environment:

In application-dev.yml (or the active dev profile), set:

auth.jwt.adminSecret: "<at-least-32-chars>"

auth.jwt.studentSecret: "<at-least-32-chars>"

auth.cookie.name: "cegm_dev_session"

Save file. Spring devtools should auto-restart the app. Do not kill the shell.

Reason: the process already started without env vars; config edit forces a hot restart safely.

Cookie attributes in dev:

For HTTP dev, set Secure=false, HttpOnly=true, SameSite=Lax, Path=/, and no Domain.

Do not use __Host- prefix when Secure=false. Use the resolved auth.cookie.name as given above.

B) Security chain and CSRF/CORS for browser

Public health + auth endpoints:

Ensure permitAll() for: GET /api/v1/health, GET /actuator/health, GET /actuator/info, POST /api/v1/auth/login, POST /api/v1/auth/signup, and all OPTIONS /**.

Match paths relative to the servlet context; no double /api/api.

CSRF:

For pure API with cookie auth, disable CSRF on API routes or implement a CSRF strategy the GUI actually sends. Given current failures, disable for API in dev to unblock.

CORS:

Allowed origins must include the actual dev UI origin(s). Add both:

http://localhost:5173 (Vite default)

http://localhost:3000 (if you sometimes run there)

Set allowCredentials=true. Allow headers: Content-Type, Authorization, X-Requested-With. Allow methods: GET,POST,PUT,DELETE,OPTIONS.

C) Frontend auth wiring

Axios client:

withCredentials: true globally.

baseURL should point to your backend root (e.g., http://localhost:8080/api/v1).

Interceptor: on 401, clear client session state and prompt re-login; do not loop.

Forms and DTOs:

Login body: {"email":"...", "password":"..."}.

Signup body: {"firstName":"...","lastName":"...","email":"...","password":"...","accountType":"STUDENT|INSTRUCTOR|STAFF|ADMIN"}.

The Signup page must include accountType (or default server-side to STUDENT). Do not send role or username unless back-compatible.

AuthContext:

After login success, immediately refetch /auth/me to hydrate the UI.

Use BroadcastChannel('auth') to refetch on role change cookie rotation.

Ensure client checks for admin routes, but rely on server for enforcement.

D) Admin bootstrap and approval flow

Admin seeding is already in place. Verify it runs on every dev restart so there is always one APPROVED admin for tests.

Approval and login sequence:

Admin logs in, lists users with keyset pagination, approves student, student logs in. This must work in both CLI and GUI.