#!/bin/bash
# CEGM LMS Frontend Development Startup Script

echo "🚀 Starting CEGM LMS Frontend Development Environment"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not found. Please install Node.js 18+."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start development server
echo "🏃 Starting Vite development server..."
npm run dev
