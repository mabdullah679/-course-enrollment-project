#!/bin/bash

# ==========================================
# scrap.sh - FULL teardown and rebuild
# WARNING: This will destroy all DB volumes
# ==========================================

set -e

cd "$HOME/course-enrollment-project" || {
  echo "❌ Failed to change directory to ~/course-enrollment-project"
  exit 1
}

echo "🧨 Stopping and deleting all containers and volumes..."
docker-compose -f docker-compose.dev.yml down -v --remove-orphans

echo "🔨 Rebuilding everything from scratch (no cache)..."
docker-compose -f docker-compose.dev.yml build --no-cache

echo "🚀 Booting up services..."
docker-compose -f docker-compose.dev.yml up
