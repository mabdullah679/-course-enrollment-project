#!/bin/bash
# CEGM LMS Backend Development Startup Script

echo "🚀 Starting CEGM LMS Backend Development Environment"

# Check if Java 21 is installed
if ! java -version 2>&1 | grep -q "21"; then
    echo "❌ Java 21 is required but not found. Please install Java 21."
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "❌ PostgreSQL is not running on localhost:5432"
    echo "Please start PostgreSQL or run the database setup script first."
    exit 1
fi

# Set environment variables
export DEV_COOKIE_NAME="cegm_session_dev"
export DEV_JWT_STUDENT_SECRET="cegm_student_jwt_secret_dev_12345678901234567890"
export DEV_JWT_ADMIN_SECRET="cegm_admin_jwt_secret_dev_67890123456789012345"

echo "✅ Environment variables set"
echo "   Cookie name: $DEV_COOKIE_NAME"
echo "   JWT secrets configured"

# Navigate to backend directory
cd "$(dirname "$0")/../backend"

echo "📦 Installing dependencies..."
./mvnw clean install -DskipTests

echo "🏃 Starting Spring Boot application..."
./mvnw spring-boot:run
