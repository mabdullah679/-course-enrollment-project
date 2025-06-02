#!/bin/bash

# ======================================
# shutdown.sh - Tear Down Dev Containers
# ======================================

set -e

echo "🛑 Shutting down all services..."
docker-compose --env-file .env -f docker-compose.dev.yml down -v

echo "🧼 Cleanup complete. Volumes removed."
