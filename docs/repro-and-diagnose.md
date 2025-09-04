How the agent must reproduce and analyze

Use new terminals only. Do not stop current watch shells.

Step 1 — Reset and export env
# new terminal
export DEV_COOKIE_NAME=cegm_dev_session
export DEV_JWT_ADMIN_SECRET='dev-admin-jwt-secret-key-at-least-32-chars-xxxxxxxxx'
export DEV_JWT_STUDENT_SECRET='dev-student-jwt-secret-key-at-least-32-chars-xxxxxxx'

Step 2 — Confirm health and headers
# Expect 200, not 403
curl -i https://localhost:8080/api/v1/health -k

# Confirm headers present
curl -I https://localhost:8080 -k | egrep -i "Content-Security-Policy|Referrer-Policy|Permissions-Policy|X-Content-Type-Options|X-Frame-Options"


If health returns 403, the security matcher is still wrong. Earlier runs showed 403 here. 

Step 3 — Seed admin (one-time per process)

Verify the startup seeding created admin@cegm.edu (approved). If using an actuator or log line, check startup logs for “Default admin created.”

Step 4 — End-to-end auth CLI cycle (repeat 3 times in same build)
# 1) Admin login (expect 200, Set-Cookie)
curl -i -k -c admin_cookies.txt \
  -H "Content-Type: application/json" \
  -X POST https://localhost:8080/api/v1/auth/login \
  --data '{"email":"admin@cegm.edu","password":"admin123"}'

# 2) Me (expect 200 with admin role)
curl -i -k -b admin_cookies.txt https://localhost:8080/api/v1/auth/me

# 3) Signup student (expect 200)
curl -i -k -X POST https://localhost:8080/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  --data '{"firstName":"Alice","lastName":"New","email":"alice@example.com","password":"student123","accountType":"STUDENT"}'

# 4) Approve student (expect 200)
# Replace <ID> with the student id from list
curl -i -k -b admin_cookies.txt "https://localhost:8080/api/v1/users?size=5"
# then:
curl -i -k -b admin_cookies.txt -X POST https://localhost:8080/api/v1/users/<ID>/approve

# 5) Student login and me (expect 200 for both)
curl -i -k -c student_cookies.txt -H "Content-Type: application/json" \
  -X POST https://localhost:8080/api/v1/auth/login \
  --data '{"email":"alice@example.com","password":"student123"}'

curl -i -k -b student_cookies.txt https://localhost:8080/api/v1/auth/me


Run the full cycle three times without restarting servers. If any step returns 401/403:

Check if cookies were set; in earlier attempts, login returned no Set-Cookie due to the missing DEV_COOKIE_NAME.

Verify HTTPS and Secure cookie behavior.

Verify that the user is approved before student login (earlier 401s were “Account not approved”). 

Step 5 — GUI verification

Run the same flow from the frontend. If preflight shows Access-Control-Allow-Origin: http://localhost:3000, fix CORS to include http://localhost:5173. Earlier preflight confirmed 3000, not 5173. 

Confirm the Admin dashboard renders with live counts and role-gated actions; unauth users must not access it.