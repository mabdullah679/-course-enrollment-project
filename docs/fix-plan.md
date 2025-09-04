What the agent must change

The backend and frontend are already running in watch mode; do not stop those shells. Open new terminals only.

A. Environment and bootstrap

Set required env vars (dev shell or run profile)

DEV_COOKIE_NAME=cegm_dev_session

DEV_JWT_ADMIN_SECRET and DEV_JWT_STUDENT_SECRET set to stable, ≥32-char values
Evidence of failures without DEV_COOKIE_NAME is in the logs. 

Dev HTTPS

Ensure backend dev runs on https://localhost:8080
 to match CSP and to allow Secure cookies.

If not available, either:
a) enable self-signed TLS for Spring dev, or
b) temporarily toggle cookie Secure off only in local profile while keeping __Host- semantics for path and domain rules in guardrails.

Seed an initial admin (H2 in-memory)

Add a startup seeding path (CommandLineRunner) that creates an APPROVED admin (admin@cegm.edu, bcrypt’d password).

This avoids the circular “need admin to approve” deadlock on a fresh H2.

B. Security chain and unauth routes

Permit health unauthenticated

Explicit permitAll() for: /api/v1/health, /actuator/health, /actuator/info.

Matchers must be relative to the servlet context. Earlier 403s indicate the matcher path may be wrong. 

Permit public auth endpoints

POST /api/v1/auth/signup, POST /api/v1/auth/login, and OPTIONS /** must be permitAll().

CSRF policy

For cookie-based session or JWT, disable CSRF for API or use a predictable CSRF strategy. 403 on signup via GUI strongly suggests CSRF or preflight mismatch.

C. CORS

Allow the actual UI origin

Add http://localhost:5173 (and https://localhost:5173 if you test via HTTPS dev) to Access-Control-Allow-Origin, with Allow-Credentials: true.

Preflight in the logs was allowing http://localhost:3000, which is not your Vite default. 

D. Cookies and rotation

Cookie creation uses env name

Confirm the cookie name uses the resolved DEV_COOKIE_NAME, not the literal ${DEV_COOKIE_NAME:?missing} token. That literal showed up in logs during failures. 

Prefix and attributes

Use __Host- prefix in dev only if Secure and Path=/ and no Domain.

On login and on role change, rotate session ID and re-issue the cookie.

E. DTO alignment and GUI fixes

Signup fields

Backend currently expects accountType and email, not role or username unless you kept username in the schema. Align the form: either remove username from the model or make it optional server-side and hide it in the GUI. Evidence of field mismatch caused earlier 4xx. 

AuthContext and Axios

withCredentials: true on all requests.

BroadcastChannel to refetch /auth/me on role change.

On 401, clear client state and surface an actionable toast.

F. Health, a11y, and perf

Health probes: Create /api/v1/health that returns 200 with {status:"UP"} unauthenticated.

a11y/perf checks: Ensure tests still run in CI; no change required here beyond keeping the guardrails.