#!/usr/bin/env bash
set -euo pipefail

# CEGM LMS Local Development Runner
# This script starts the complete local development environment

echo "🚀 Starting CEGM LMS Local Development Environment"

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up processes..."
    pkill -f "cegm-backend" || true
    pkill -f "vite" || true
    echo "✅ Cleanup complete"
}
trap cleanup EXIT

# Create logs directory if it doesn't exist
mkdir -p logs

echo "📦 Building backend..."
cd backend
./mvnw clean package -DskipTests=true
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "🔧 Starting backend server..."
cd backend
nohup java -jar target/cegm-backend-0.0.1-SNAPSHOT.jar > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/health >/dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

echo "🎨 Starting frontend server..."
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "⏳ Waiting for frontend to start..."
for i in {1..20}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "❌ Frontend failed to start within 20 seconds"
        exit 1
    fi
    sleep 1
done

echo ""
echo "🎉 CEGM LMS is now running locally!"
echo "👀 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8080"
echo "🗃️  H2 Database Console: http://localhost:8080/h2-console"
echo "📄 Backend logs: tail -f logs/backend.log"
echo "📄 Frontend logs: tail -f logs/frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running
wait
