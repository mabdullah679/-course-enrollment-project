Current-state diagnosis
Observed symptoms

Health endpoints return 403 for both /api/v1/health and /api/health. 

All protected endpoints return 403 when hit without a valid session (e.g., /api/v1/users, /api/v1/courses). 

Login returns 500 or 401 and never sets cookies; /auth/me stays 403. No Set-Cookie emitted. 

Signup GUI reports 403; CLI signup works once, but the new account cannot log in until approved, returning 401. 

Root causes (from logs and responses)

Missing cookie name env var
The backend attempts to resolve ${DEV_COOKIE_NAME}, fails, and throws IllegalState/IllegalArgument exceptions. This blocks cookie creation and breaks auth flows, producing 500s and 403s. 

Health endpoints not permitted
403 on /api/v1/health indicates the security chain is protecting health routes; they should be public. 

CORS origin mismatch
Preflight shows Access-Control-Allow-Origin: http://localhost:3000, but your dev UI runs on Vite (commonly http://localhost:5173). This mismatch causes browser-side failures and can surface as 403s for GUI flows, even when CLI works. 

Unapproved accounts
New users are created but not approved; login then returns 401 (“Account not approved”). This is correct behavior, but test scripts didn’t complete the admin-approval step due to the cookie/role chain being broken.

HTTPS vs Secure cookies (dev)
Your CSP already targets https://localhost:8080 in connect-src. If cookies use Secure (as guardrails require), plain http:// browser calls will not persist them. The CLI won’t show Set-Cookie either if cookie creation failed earlier due to the missing name. 

Clarifying “health probes require auth?”

Backend health should not require auth for liveness/readiness (permit /api/v1/health and /actuator/health). That’s already implied by the SSoT guardrails and acceptance matrix (public checks, no tokens).

Frontend health (e.g., /health.json or /_status) should also be public so infra can probe without session.
Your current 403s confirm the backend is incorrectly protecting health. 