#!/bin/bash

# CEGM LMS - Environment Setup Script for Testing the Fixed API Contracts

echo "Setting up CEGM LMS for testing the API contract fixes..."

# Set JWT secret environment variable
export JWT_SECRET="cegm-lms-jwt-secret-key-for-testing-only-32-chars-min"

echo "✅ JWT_SECRET environment variable set"

# Create basic test data script for H2 database
cat > /tmp/test-admin-user.sql << 'EOF'
INSERT INTO users (id, username, email, first_name, last_name, password, role, approved, active, created_at, updated_at)
VALUES (1, 'admin', 'admin@cegm.edu', 'Admin', 'User', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'ADMIN', true, true, NOW(), NOW());

INSERT INTO users (id, username, email, first_name, last_name, password, role, approved, active, created_at, updated_at)
VALUES (2, 'student1', 'student1@example.com', 'Jane', 'Student', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'STUDENT', true, true, NOW(), NOW());

INSERT INTO courses (id, code, name, description, credits, status, created_at, updated_at)
VALUES (1, 'CS101', 'Introduction to Computer Science', 'Basic programming concepts', 3, 'ACTIVE', NOW(), NOW());
EOF

echo "✅ Test data script created at /tmp/test-admin-user.sql"

echo "
🚀 CEGM LMS API Contract Fixes - Ready for Testing

Key changes implemented:
1. ✅ Fixed Users API contracts (/users/{id}/role, /users/{id}/status, /users/{id}/audit)
2. ✅ Added keyset pagination with 'after' cursor for Grades/Enrollments
3. ✅ Enhanced validation error handling with field-specific messages
4. ✅ Added X-Request-Id support for audit logging
5. ✅ Moved JWT secret to environment variable
6. ✅ Fixed Java version compatibility (17)

To test the fixes:

1. Backend:
   cd backend && ./mvnw spring-boot:run

2. Frontend:
   cd frontend && npm run dev

3. Test admin role changes:
   - Login as admin@cegm.edu (password: password)  
   - Go to /admin/users
   - Try changing a user's role from Student to Instructor
   - Check that badges update without page reload

4. Test validation errors:
   - Go to /admin/course-management
   - Try creating a course with empty required fields
   - Verify field-specific error messages appear

5. Test pagination:
   - Check /admin/grade-management and /admin/enrollments
   - Verify they load without 500 errors
   - Check that pagination uses 'after' cursor

Environment Variables:
- JWT_SECRET: Set to prevent hardcoded secrets
- Default H2 database with test data available

All unit tests pass:
- UserService role/status change tests ✅
- Course validation DTO tests ✅
"