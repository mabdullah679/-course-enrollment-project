#!/bin/bash

# ===============================
# dev.sh - Local Dev Bootstrapper
# ===============================

set -e

echo "🔄 Sourcing central config..."
source ./backend/automation/central-config.sh

echo "📦 Shutting down old Docker environment..."
sudo docker compose --env-file .env -f docker-compose.dev.yml down -v

echo "🚀 Starting dev environment with rebuild..."
sudo docker compose --env-file .env -f docker-compose.dev.yml up --build
