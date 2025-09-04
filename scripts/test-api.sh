#!/bin/bash

# CEGM LMS Authentication and API Test Script
# Tests the complete authentication flow and key API endpoints

BASE_URL="http://localhost:8080"
API_V1="${BASE_URL}/api/v1"

echo "=== CEGM LMS API Testing ==="
echo "Testing authentication and management APIs..."

# Test 1: Health check
echo
echo "1. Health Check:"
curl -s -w "HTTP %{http_code}\n" "${BASE_URL}/actuator/health" || echo "Health endpoint not available"

# Test 2: Sign up new user
echo
echo "2. Sign Up New User:"
SIGNUP_RESPONSE=$(curl -s -w "HTTP %{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User", 
    "email": "testuser@example.com",
    "username": "testuser",
    "password": "password123",
    "accountType": "STUDENT"
  }' \
  "${API_V1}/auth/signup")

echo "$SIGNUP_RESPONSE"

# Test 3: Login with new user
echo
echo "3. Login with Test User:"
LOGIN_RESPONSE=$(curl -s -c cookies.txt -w "HTTP %{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }' \
  "${API_V1}/auth/login")

echo "$LOGIN_RESPONSE"

# Test 4: Get current user info (using cookie)
echo
echo "4. Get Current User Info:"
USER_INFO=$(curl -s -b cookies.txt -w "HTTP %{http_code}" \
  "${API_V1}/auth/me")

echo "$USER_INFO"

# Test 5: Try to access protected admin endpoint (should fail)
echo
echo "5. Try to Access Admin Users Endpoint (should fail for student):"
ADMIN_RESPONSE=$(curl -s -b cookies.txt -w "HTTP %{http_code}" \
  "${API_V1}/users")

echo "$ADMIN_RESPONSE"

# Test 6: Get available courses
echo
echo "6. Get Available Courses:"
COURSES_RESPONSE=$(curl -s -b cookies.txt -w "HTTP %{http_code}" \
  "${API_V1}/courses")

echo "$COURSES_RESPONSE"

# Test 7: Logout
echo
echo "7. Logout:"
LOGOUT_RESPONSE=$(curl -s -b cookies.txt -w "HTTP %{http_code}" -X POST \
  "${API_V1}/auth/logout")

echo "$LOGOUT_RESPONSE"

# Test 8: Try to access protected endpoint after logout (should fail)
echo
echo "8. Try to Access Protected Endpoint After Logout (should fail):"
PROTECTED_RESPONSE=$(curl -s -b cookies.txt -w "HTTP %{http_code}" \
  "${API_V1}/auth/me")

echo "$PROTECTED_RESPONSE"

# Clean up
rm -f cookies.txt

echo
echo "=== Test Complete ==="
echo "Check the HTTP status codes and responses above."
echo "Expected: 200 for successful operations, 401/403 for unauthorized access"
