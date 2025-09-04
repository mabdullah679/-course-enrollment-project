Ordered tasks for Sonnet 4

Do not stop existing shells. Use watch mode behavior only.

Edit application-dev.yml to add auth.jwt.adminSecret, auth.jwt.studentSecret, and auth.cookie.name. Save to trigger auto-restart.

Verify logs show secrets and cookie name resolved; no ${...: ?missing} tokens.

Security config: confirm permitAll() for health, login, signup, and all OPTIONS, and that matchers are relative to the servlet context.

Disable CSRF on API routes in dev, or implement CSRF headers that the GUI sends today. Goal is to eliminate 403 on signup/login.

CORS: allow http://localhost:5173 and http://localhost:3000 with credentials; methods GET,POST,PUT,DELETE,OPTIONS; headers Content-Type, Authorization, X-Requested-With.

Cookies: in dev, Secure=false, HttpOnly=true, SameSite=Lax, Path=/. Use the runtime-resolved auth.cookie.name. Do not use __Host- since Secure=false.

Axios: ensure withCredentials: true and correct baseURL. Add 401 handler that clears state and prompts re-login. After login, refetch /auth/me.

Forms: Login uses email and password. Signup uses firstName,lastName,email,password,accountType. Ensure Signup UI exposes accountType or the server defaults it to STUDENT.

Run the CLI test cycle from gui-repro-and-diagnose.md three times in the same build, capture outputs.

Run the GUI tests (login, signup, approval, student login), capture Network panel proof of Set-Cookie, Cookie on requests, 200 responses.

Deliver: a short report confirming all items pass, with the curl outputs and a summary of GUI network results.