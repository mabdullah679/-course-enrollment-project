Repeatable tests the agent must run

New terminals only. Do not stop existing shells.

1) Confirm secrets are live

Wait for Spring devtools to auto-restart after editing application-dev.yml.

Check backend logs: confirm the JWT secrets and cookie name are resolved (no ${VAR:?missing} literals).

2) Public health check
curl -i http://localhost:8080/api/v1/health
# Expect: 200, JSON body { status: "UP", ... }

3) CLI auth cycle (repeat 3 times without restarting servers)
# Admin login
curl -i -c admin_cookies.txt -H "Content-Type: application/json" \
  -X POST http://localhost:8080/api/v1/auth/login \
  --data '{"email":"admin@cegm.edu","password":"admin123"}'

# Me (admin)
curl -i -b admin_cookies.txt http://localhost:8080/api/v1/auth/me

# Signup student
curl -i -H "Content-Type: application/json" \
  -X POST http://localhost:8080/api/v1/auth/signup \
  --data '{"firstName":"Alice","lastName":"New","email":"alice@example.com","password":"student123","accountType":"STUDENT"}'

# List users to get Alice's id (keyset pagination)
curl -i -b admin_cookies.txt "http://localhost:8080/api/v1/users?size=5"

# Approve user
curl -i -b admin_cookies.txt -X POST http://localhost:8080/api/v1/users/<ID>/approve

# Student login + me
curl -i -c student_cookies.txt -H "Content-Type: application/json" \
  -X POST http://localhost:8080/api/v1/auth/login \
  --data '{"email":"alice@example.com","password":"student123"}'

curl -i -b student_cookies.txt http://localhost:8080/api/v1/auth/me


Evidence to capture: presence of Set-Cookie on admin login, 200s for /auth/me, 200 on signup, 200 on approve, 200 on student login.

Run the full sequence three times with different student emails without restarting servers.

4) GUI auth sequence

Load the app (e.g., http://localhost:5173 or http://localhost:3000).

Open DevTools Network tab; check Request headers contain Cookie on authenticated calls and Responses include Set-Cookie on login.

Try:

Admin login from UI → expect dashboard to show admin role and live counts.

Signup a new STUDENT from UI → expect 200 and toast confirmation.

Admin approves that user from UI → student logs in from UI and sees student-scoped pages.

If a browser call fails preflight with CORS, verify the response shows your UI origin in Access-Control-Allow-Origin and that Access-Control-Allow-Credentials: true is present.