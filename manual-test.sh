#!/bin/bash

# Manual Test Script for Backend API Changes
# This script tests the key endpoints that were modified

BASE_URL="http://localhost:8080"
ADMIN_TOKEN="your-admin-jwt-token-here"

echo "🧪 Testing User Management API Changes"
echo "=====================================\n"

echo "1. Testing Health Endpoint (should be public)"
curl -w "\nHTTP Status: %{http_code}\n" -H "X-Request-Id: test-health-123" $BASE_URL/api/v1/health
echo ""

echo "2. Testing Role Change Endpoint (POST /api/v1/users/1/role)"
echo "Expected: 401 (unauthorized) or 403 (forbidden) without proper auth"
curl -w "\nHTTP Status: %{http_code}\n" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: test-role-123" \
  -d '{"role": "INSTRUCTOR"}' \
  $BASE_URL/api/v1/users/1/role
echo ""

echo "3. Testing Status Update Endpoint (PUT /api/v1/users/1/status)"
echo "Expected: 401 (unauthorized) or 403 (forbidden) without proper auth"
curl -w "\nHTTP Status: %{http_code}\n" \
  -X PUT \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: test-status-123" \
  -d '{"approved": true, "active": true}' \
  $BASE_URL/api/v1/users/1/status
echo ""

echo "4. Testing Audit Endpoint (GET /api/v1/users/1/audit)"
echo "Expected: 401 (unauthorized) or 403 (forbidden) without proper auth"
curl -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Request-Id: test-audit-123" \
  "$BASE_URL/api/v1/users/1/audit?limit=10"
echo ""

echo "5. Testing Course Creation with Validation (POST /api/v1/courses)"
echo "Expected: 401 (unauthorized) or 403 (forbidden) without proper auth"
curl -w "\nHTTP Status: %{http_code}\n" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: test-course-123" \
  -d '{"name": "", "code": "", "credits": 0}' \
  $BASE_URL/api/v1/courses
echo ""

echo "6. Testing Grades List (GET /api/v1/grades)"
echo "Expected: 401 (unauthorized) or 403 (forbidden) without proper auth"
curl -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Request-Id: test-grades-123" \
  "$BASE_URL/api/v1/grades?page=0&size=20"
echo ""

echo "7. Testing Enrollments List (GET /api/v1/enrollments)"
echo "Expected: 401 (unauthorized) or 403 (forbidden) without proper auth"
curl -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Request-Id: test-enrollments-123" \
  "$BASE_URL/api/v1/enrollments?page=0&size=20"
echo ""

echo "✅ All endpoints tested. With proper authentication:"
echo "  - Role changes should use POST /users/{id}/role with {role: string}"
echo "  - Status updates should use PUT /users/{id}/status with {approved?, active?}"
echo "  - Audit history available at GET /users/{id}/audit"
echo "  - Course validation returns field-specific errors"
echo "  - X-Request-Id headers are echoed back in responses"
echo "  - Grades and Enrollments return empty lists instead of 500 errors"