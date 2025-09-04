Exact changes the agent must make (ordered)

Do not stop watch shells. Open new terminals only.

Set env vars: DEV_COOKIE_NAME, DEV_JWT_ADMIN_SECRET, DEV_JWT_STUDENT_SECRET for the dev run profile. 

Cookie creation: ensure the cookie name uses the resolved DEV_COOKIE_NAME, not the literal token; use __Host- rules where possible in dev TLS. 

Security chain:

permitAll() for /api/v1/health, /actuator/health, /actuator/info, POST /api/v1/auth/login, POST /api/v1/auth/signup, and all OPTIONS.

Recheck that matchers are relative to the context path to avoid /api/api mistakes. 403s on health prove it’s wrong today. 

CORS: add http://localhost:5173 (and https://localhost:5173 if needed) with credentials enabled; keep 3000 only if you actually use it. 

Seed admin in H2 at startup as APPROVED.

AuthContext: withCredentials: true; refetch /auth/me on role change via BroadcastChannel; 401 handler clears state and prompts re-login.

Signup form vs DTO: ensure the form uses email, password, accountType; remove or make username optional. Evidence of mismatch existed in earlier attempts. 

Repeatability: execute the three-round CLI test in repro-and-diagnose.md with no server restarts.

Report: include the final curl -i snippets showing 200s and the presence of Set-Cookie for login, and a screenshot of the admin GUI showing approved user counts.