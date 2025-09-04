#!/bin/bash

# CEGM LMS Admin Test Script
# Tests admin functionality and complete user workflow

BASE_URL="http://localhost:8080"
API_V1="${BASE_URL}/api/v1"

echo "=== CEGM LMS Admin Testing ==="
echo "Testing admin user creation, approval workflow, and role management..."

# Test 1: Create admin user 
echo
echo "1. Create Admin User:"
ADMIN_SIGNUP=$(curl -s -w "HTTP %{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User", 
    "email": "admin@cegm.edu",
    "username": "admin",
    "password": "admin123",
    "accountType": "ADMIN"
  }' \
  "${API_V1}/auth/signup")

echo "$ADMIN_SIGNUP"

# Test 2: Create a regular student user to approve
echo
echo "2. Create Student User for Testing:"
STUDENT_SIGNUP=$(curl -s -w "HTTP %{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Student", 
    "email": "jane.student@example.com",
    "username": "janestudent",
    "password": "student123",
    "accountType": "STUDENT"
  }' \
  "${API_V1}/auth/signup")

echo "$STUDENT_SIGNUP"

echo
echo "3. Manual Database Update Required:"
echo "Since we need approved admin user, please run this SQL manually:"
echo "UPDATE users SET status = 'APPROVED', approved = true WHERE email = 'admin@cegm.edu';"
echo ""
echo "After updating the database, press Enter to continue..."
read -r

# Test 3: Login as admin
echo
echo "4. Login as Admin:"
ADMIN_LOGIN=$(curl -s -c admin_cookies.txt -w "HTTP %{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cegm.edu",
    "password": "admin123"
  }' \
  "${API_V1}/auth/login")

echo "$ADMIN_LOGIN"

# Test 4: Get admin user info
echo
echo "5. Get Admin User Info:"
ADMIN_INFO=$(curl -s -b admin_cookies.txt -w "HTTP %{http_code}" \
  "${API_V1}/auth/me")

echo "$ADMIN_INFO"

# Test 5: List users (admin endpoint)
echo
echo "6. List All Users (Admin Access):"
USERS_LIST=$(curl -s -b admin_cookies.txt -w "HTTP %{http_code}" \
  "${API_V1}/users?limit=10")

echo "$USERS_LIST"

# Extract user ID from the student signup response
STUDENT_ID=$(echo "$STUDENT_SIGNUP" | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

if [ -n "$STUDENT_ID" ]; then
    # Test 6: Approve the student user
    echo
    echo "7. Approve Student User (ID: $STUDENT_ID):"
    APPROVE_RESPONSE=$(curl -s -b admin_cookies.txt -w "HTTP %{http_code}" -X POST \
      "${API_V1}/users/${STUDENT_ID}/approve")

    echo "$APPROVE_RESPONSE"

    # Test 7: Login as approved student
    echo
    echo "8. Login as Approved Student:"
    STUDENT_LOGIN=$(curl -s -c student_cookies.txt -w "HTTP %{http_code}" -X POST \
      -H "Content-Type: application/json" \
      -d '{
        "email": "jane.student@example.com",
        "password": "student123"
      }' \
      "${API_V1}/auth/login")

    echo "$STUDENT_LOGIN"

    # Test 8: Student access to courses
    echo
    echo "9. Student Access to Courses:"
    STUDENT_COURSES=$(curl -s -b student_cookies.txt -w "HTTP %{http_code}" \
      "${API_V1}/courses")

    echo "$STUDENT_COURSES"

    # Test 9: Student tries to access admin endpoint (should fail)
    echo
    echo "10. Student Tries Admin Endpoint (should fail):"
    STUDENT_ADMIN_FAIL=$(curl -s -b student_cookies.txt -w "HTTP %{http_code}" \
      "${API_V1}/users")

    echo "$STUDENT_ADMIN_FAIL"

    # Test 10: Admin changes student role to instructor
    echo
    echo "11. Admin Changes Student Role to Instructor:"
    ROLE_CHANGE=$(curl -s -b admin_cookies.txt -w "HTTP %{http_code}" -X POST \
      -H "Content-Type: application/json" \
      -d '{
        "role": "INSTRUCTOR"
      }' \
      "${API_V1}/users/${STUDENT_ID}/roles")

    echo "$ROLE_CHANGE"

    # Clean up
    rm -f student_cookies.txt
else
    echo "Could not extract student ID for further testing"
fi

# Clean up
rm -f admin_cookies.txt

echo
echo "=== Admin Test Complete ==="
echo "This test demonstrates the complete user approval and role management workflow."
