#!/bin/bash

# CEGM LMS Complete Workflow Test Script
# Tests the complete authentication flow with seeded admin user and comprehensive user management

echo "=== CEGM LMS Complete Workflow Test ==="
echo "Testing authentication with seeded admin and complete user management flow..."

# Test 1: Admin Login (using seeded admin@cegm.edu)
echo
echo "1. Admin Login (using seeded admin@cegm.edu):"
ADMIN_RESPONSE=$(curl -s -c admin_cookies.txt -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@cegm.edu", "password": "admin123"}' \
  -w "HTTP %{http_code}")
echo "$ADMIN_RESPONSE"

# Test 2: Get Admin User Info (/auth/me)
echo
echo "2. Get Admin User Info (/auth/me):"
ME_RESPONSE=$(curl -s -b admin_cookies.txt "http://localhost:8080/api/v1/auth/me" \
  -w "HTTP %{http_code}")
echo "$ME_RESPONSE"

# Test 3: List Users with Keyset Pagination (Admin Access)
echo
echo "3. List Users with Keyset Pagination (Admin Access):"
USERS_RESPONSE=$(curl -s -b admin_cookies.txt "http://localhost:8080/api/v1/admin/users?limit=10" \
  -w "HTTP %{http_code}")
echo "$USERS_RESPONSE"

# Test 4: Sign Up New Student User
echo
echo "4. Sign Up New Student User:"
SIGNUP_RESPONSE=$(curl -s -X POST "http://localhost:8080/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alicestudent",
    "email": "alice.newstudent@example.com",
    "password": "StudentPass123!",
    "firstName": "Alice",
    "lastName": "NewStudent"
  }' \
  -w "HTTP %{http_code}")
echo "$SIGNUP_RESPONSE"

# Extract student ID for later use
STUDENT_ID=$(echo "$SIGNUP_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -1)
echo
echo "Extracted Student ID: $STUDENT_ID"

# Test 5: Try Login as Unapproved Student (should fail)
echo
echo "5. Try Login as Unapproved Student (should fail):"
STUDENT_LOGIN_FAIL=$(curl -s -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "alice.newstudent@example.com", "password": "StudentPass123!"}' \
  -w "HTTP %{http_code}")
echo "$STUDENT_LOGIN_FAIL"

# Test 6: Admin Approves Student (ID from signup response)
echo
echo "6. Admin Approves Student (ID: $STUDENT_ID):"
APPROVE_RESPONSE=$(curl -s -b admin_cookies.txt -X PUT "http://localhost:8080/api/v1/admin/users/$STUDENT_ID/approve" \
  -w "HTTP %{http_code}")
echo "$APPROVE_RESPONSE"

# Test 7: Login as Approved Student (should succeed)
echo
echo "7. Login as Approved Student (should succeed):"
STUDENT_LOGIN_SUCCESS=$(curl -s -c student_cookies.txt -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "alice.newstudent@example.com", "password": "StudentPass123!"}' \
  -w "HTTP %{http_code}")
echo "$STUDENT_LOGIN_SUCCESS"

# Test 8: Student Gets Own Info
echo
echo "8. Student Gets Own Info:"
STUDENT_ME=$(curl -s -b student_cookies.txt "http://localhost:8080/api/v1/auth/me" \
  -w "HTTP %{http_code}")
echo "$STUDENT_ME"

# Test 9: Student Tries Admin Endpoint (should fail with 403)
echo
echo "9. Student Tries Admin Endpoint (should fail with 403):"
STUDENT_ADMIN_FAIL=$(curl -s -b student_cookies.txt "http://localhost:8080/api/v1/admin/users" \
  -w "HTTP %{http_code}")
echo "$STUDENT_ADMIN_FAIL"

# Test 10: Student Access to Courses
echo
echo "10. Student Access to Courses:"
STUDENT_COURSES=$(curl -s -b student_cookies.txt "http://localhost:8080/api/v1/courses" \
  -w "HTTP %{http_code}")
echo "$STUDENT_COURSES"

# Test 11: Admin Changes Student Role to Instructor (with session rotation)
echo
echo "11. Admin Changes Student Role to Instructor (with session rotation):"
ROLE_CHANGE=$(curl -s -b admin_cookies.txt -X PUT "http://localhost:8080/api/v1/admin/users/$STUDENT_ID/role" \
  -H "Content-Type: application/json" \
  -d '{"role": "INSTRUCTOR"}' \
  -w "HTTP %{http_code}")
echo "$ROLE_CHANGE"

# Test 12: Student Re-login After Role Change
echo
echo "12. Student Re-login After Role Change:"
STUDENT_RELOGIN=$(curl -s -c student_new_cookies.txt -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "alice.newstudent@example.com", "password": "StudentPass123!"}' \
  -w "HTTP %{http_code}")
echo "$STUDENT_RELOGIN"

# Test 13: Check Updated Role Info
echo
echo "13. Check Updated Role Info:"
UPDATED_ROLE=$(curl -s -b student_new_cookies.txt "http://localhost:8080/api/v1/auth/me" \
  -w "HTTP %{http_code}")
echo "$UPDATED_ROLE"

# Test 14: Admin CSV Export (Users)
echo
echo "14. Admin CSV Export (Users):"
CSV_EXPORT=$(curl -s -b admin_cookies.txt "http://localhost:8080/api/v1/admin/exports/users" \
  -w "HTTP %{http_code}")
echo "$CSV_EXPORT"

# Test 15: Admin Logout
echo
echo "15. Admin Logout:"
LOGOUT_RESPONSE=$(curl -s -b admin_cookies.txt -X POST "http://localhost:8080/api/v1/auth/logout" \
  -w "HTTP %{http_code}")
echo "$LOGOUT_RESPONSE"

# Test 16: Try Admin Endpoint After Logout (should fail)
echo
echo "16. Try Admin Endpoint After Logout (should fail):"
POST_LOGOUT_FAIL=$(curl -s -b admin_cookies.txt "http://localhost:8080/api/v1/admin/users" \
  -w "HTTP %{http_code}")
echo "$POST_LOGOUT_FAIL"

# Test 17: Security Headers Check
echo
echo "17. Security Headers Check:"
echo "Checking for required security headers..."
curl -s -I "http://localhost:8080/api/v1/auth/me" | grep -E "(Content-Security-Policy|Referrer-Policy|Permissions-Policy|X-Content-Type-Options|X-Frame-Options)"

echo
echo "=== Complete Workflow Test Finished ==="
echo
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

# Cleanup
rm -f admin_cookies.txt student_cookies.txt student_new_cookies.txt
