#!/bin/bash
# CEGM LMS Complete Development Environment Startup

echo "🚀 CEGM LMS - Complete Development Environment Setup"
echo "=================================================="

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📁 Project root: $PROJECT_ROOT"

# Make scripts executable
chmod +x "$SCRIPT_DIR"/*.sh

# Step 1: Setup database
echo "🗄️  Step 1: Setting up database..."
"$SCRIPT_DIR/setup-database.sh"
if [ $? -ne 0 ]; then
    echo "❌ Database setup failed"
    exit 1
fi

# Step 2: Start backend in background
echo "🔧 Step 2: Starting backend..."
"$SCRIPT_DIR/start-backend.sh" &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 30

# Step 3: Start frontend
echo "🎨 Step 3: Starting frontend..."
"$SCRIPT_DIR/start-frontend.sh" &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo "🎉 CEGM LMS Development Environment is ready!"
echo "   Backend:  http://localhost:8080"
echo "   Frontend: http://localhost:3000"
echo ""
echo "📋 Available endpoints:"
echo "   Health:   http://localhost:8080/api/health"
echo "   Auth:     http://localhost:8080/api/auth"
echo "   Courses:  http://localhost:8080/api/courses"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT
wait
