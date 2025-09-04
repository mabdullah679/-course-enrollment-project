#!/bin/bash

# CEGM LMS Complete Authentication and Admin Workflow Test
# Tests full auth flow with seeded admin user and user management

BASE_URL="http://localhost:8080"
API_V1="${BASE_URL}/api/v1"

echo "=== CEGM LMS Complete Workflow Test ==="
echo "Testing authentication with seeded admin and complete user management flow..."
echo ""

# Test 1: Admin Login (using seeded admin)
echo "1. Admin Login (using seeded admin@cegm.edu):"
ADMIN_LOGIN=$(curl -s -c admin_cookies.txt -w "\nHTTP %{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cegm.edu",
    "password": "admin123"
  }' \
  "${API_V1}/auth/login")

echo "$ADMIN_LOGIN"
echo ""

# Test 2: Get admin user info
echo "2. Get Admin User Info (/auth/me):"
ADMIN_INFO=$(curl -s -b admin_cookies.txt -w "\nHTTP %{http_code}" \
  "${API_V1}/auth/me")

echo "$ADMIN_INFO"
echo ""

# Test 3: List users with keyset pagination (admin access)
echo "3. List Users with Keyset Pagination (Admin Access):"
USERS_LIST=$(curl -s -b admin_cookies.txt -w "\nHTTP %{http_code}" \
  "${API_V1}/users?limit=10")

echo "$USERS_LIST"
echo ""

# Test 4: Sign up new student user
echo "4. Sign Up New Student User:"
STUDENT_SIGNUP=$(curl -s -w "\nHTTP %{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "NewStudent", 
    "email": "alice.newstudent@example.com",
    "username": "alicestudent",
    "password": "student123",
    "accountType": "STUDENT"
  }' \
  "${API_V1}/auth/signup")

echo "$STUDENT_SIGNUP"
echo ""

# Extract student ID from signup response
STUDENT_ID=$(echo "$STUDENT_SIGNUP" | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)
echo "Extracted Student ID: $STUDENT_ID"
echo ""

# Test 5: Try to login as unapproved student (should fail)
echo "5. Try Login as Unapproved Student (should fail):"
STUDENT_LOGIN_FAIL=$(curl -s -w "\nHTTP %{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.newstudent@example.com",
    "password": "student123"
  }' \
  "${API_V1}/auth/login")

echo "$STUDENT_LOGIN_FAIL"
echo ""

if [ -n "$STUDENT_ID" ]; then
    # Test 6: Admin approves the student
    echo "6. Admin Approves Student (ID: $STUDENT_ID):"
    APPROVE_RESPONSE=$(curl -s -b admin_cookies.txt -w "\nHTTP %{http_code}" -X POST \
      "${API_V1}/users/${STUDENT_ID}/approve")

    echo "$APPROVE_RESPONSE"
    echo ""

    # Test 7: Login as approved student (should succeed)
    echo "7. Login as Approved Student (should succeed):"
    STUDENT_LOGIN=$(curl -s -c student_cookies.txt -w "\nHTTP %{http_code}" -X POST \
      -H "Content-Type: application/json" \
      -d '{
        "email": "alice.newstudent@example.com",
        "password": "student123"
      }' \
      "${API_V1}/auth/login")

    echo "$STUDENT_LOGIN"
    echo ""

    # Test 8: Student gets their own info
    echo "8. Student Gets Own Info:"
    STUDENT_INFO=$(curl -s -b student_cookies.txt -w "\nHTTP %{http_code}" \
      "${API_V1}/auth/me")

    echo "$STUDENT_INFO"
    echo ""

    # Test 9: Student tries to access admin endpoint (should fail)
    echo "9. Student Tries Admin Endpoint (should fail with 403):"
    STUDENT_ADMIN_FAIL=$(curl -s -b student_cookies.txt -w "\nHTTP %{http_code}" \
      "${API_V1}/users")

    echo "$STUDENT_ADMIN_FAIL"
    echo ""

    # Test 10: Student access to courses (should work)
    echo "10. Student Access to Courses:"
    STUDENT_COURSES=$(curl -s -b student_cookies.txt -w "\nHTTP %{http_code}" \
      "${API_V1}/courses")

    echo "$STUDENT_COURSES"
    echo ""

    # Test 11: Admin changes student role to instructor (session rotation)
    echo "11. Admin Changes Student Role to Instructor (with session rotation):"
    ROLE_CHANGE=$(curl -s -b admin_cookies.txt -w "\nHTTP %{http_code}" -X POST \
      -H "Content-Type: application/json" \
      -d '{
        "role": "INSTRUCTOR"
      }' \
      "${API_V1}/users/${STUDENT_ID}/roles")

    echo "$ROLE_CHANGE"
    echo ""

    # Test 12: Student login again to get new role
    echo "12. Student Re-login After Role Change:"
    STUDENT_RELOGIN=$(curl -s -c student_new_cookies.txt -w "\nHTTP %{http_code}" -X POST \
      -H "Content-Type: application/json" \
      -d '{
        "email": "alice.newstudent@example.com",
        "password": "student123"
      }' \
      "${API_V1}/auth/login")

    echo "$STUDENT_RELOGIN"
    echo ""

    # Test 13: Check updated role
    echo "13. Check Updated Role Info:"
    INSTRUCTOR_INFO=$(curl -s -b student_new_cookies.txt -w "\nHTTP %{http_code}" \
      "${API_V1}/auth/me")

    echo "$INSTRUCTOR_INFO"
    echo ""

    # Clean up student cookies
    rm -f student_cookies.txt student_new_cookies.txt
else
    echo "Could not extract student ID, skipping approval and role change tests"
fi

# Test 14: Admin CSV export (policy checked, audited)
echo "14. Admin CSV Export (Users):"
EXPORT_RESPONSE=$(curl -s -b admin_cookies.txt -w "\nHTTP %{http_code}" \
  "${API_V1}/exports/users")

echo "$EXPORT_RESPONSE"
echo ""

# Test 15: Logout admin
echo "15. Admin Logout:"
ADMIN_LOGOUT=$(curl -s -b admin_cookies.txt -w "\nHTTP %{http_code}" -X POST \
  "${API_V1}/auth/logout")

echo "$ADMIN_LOGOUT"
echo ""

# Test 16: Try to access protected endpoint after logout (should fail)
echo "16. Try Admin Endpoint After Logout (should fail):"
LOGOUT_FAIL=$(curl -s -b admin_cookies.txt -w "\nHTTP %{http_code}" \
  "${API_V1}/auth/me")

echo "$LOGOUT_FAIL"
echo ""

# Security Headers Test
echo "17. Security Headers Check:"
echo "Checking for required security headers..."
HEADERS_CHECK=$(curl -s -I "${BASE_URL}")
echo "$HEADERS_CHECK" | grep -E "(Content-Security-Policy|Referrer-Policy|Permissions-Policy|X-Content-Type-Options|X-Frame-Options)"
echo ""

# Clean up
rm -f admin_cookies.txt

echo "=== Complete Workflow Test Finished ==="
echo ""
echo "Expected Results Summary:"
echo "- Admin login: 200 with Set-Cookie headers"
echo "- Student signup: 200 with pending approval"
echo "- Unapproved student login: 401/403"
echo "- Admin approve: 200"
echo "- Approved student login: 200"
echo "- Student admin access: 403"
echo "- Student course access: 200"
echo "- Role change: 200 with session rotation"
echo "- CSV export: 200 or blob data"
echo "- Logout: 200"
echo "- Post-logout access: 401/403"
echo "- Security headers: Present"
