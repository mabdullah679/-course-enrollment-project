#!/usr/bin/env bash
set -euo pipefail

# CEGM LMS Smoke Tests
# This script runs basic smoke tests to verify the system is working

echo "🧪 Running CEGM LMS Smoke Tests"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    echo -n "Testing $test_name... "
    
    if result=$(eval "$test_command" 2>&1); then
        if [[ "$result" =~ $expected_pattern ]]; then
            echo -e "${GREEN}PASS${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}FAIL${NC} (unexpected response: $result)"
            ((TESTS_FAILED++))
        fi
    else
        echo -e "${RED}FAIL${NC} (command failed: $result)"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Backend Health Check
run_test "Backend Health Check" \
    "curl -s http://localhost:8080/api/health" \
    '"success"'

# Test 2: Frontend Serving
run_test "Frontend Serving" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" \
    "200"

# Test 3: SSoT Configuration Loading (check for validation message in logs)
run_test "SSoT Validation" \
    "grep 'SSoT configuration validated successfully' logs/backend.log" \
    "validated successfully"

# Test 4: Database Connection (H2 Console)
run_test "Database Console" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/h2-console" \
    "200"

# Test 5: CORS Headers
run_test "CORS Configuration" \
    "curl -s -H 'Origin: http://localhost:3000' -H 'Access-Control-Request-Method: GET' -X OPTIONS http://localhost:8080/api/health -I" \
    "Access-Control-Allow-Origin"

# Test 6: API Error Handling (test unknown endpoint)
run_test "API Error Handling" \
    "curl -s http://localhost:8080/api/nonexistent" \
    '"message".*"Contact admin for assistance"'

echo ""
echo "📊 Test Results:"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All smoke tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check the logs and configuration.${NC}"
    exit 1
fi
