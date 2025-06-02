#!/bin/bash

# ===================================
# start-gateway.sh - Run GatewayApp
# ===================================

set -e

echo "🔄 Sourcing shared config..."
source ./backend/automation/central-config.sh

echo "🚀 Starting GatewayApp container..."
docker run -it --rm \
  --name gateway-app \
  --network course-enrollment-project_devnet \
  -e SPRING_PROFILES_ACTIVE=$SPRING_PROFILES_ACTIVE \
  -p $GATEWAYAPP_PORT:8080 \
  $GATEWAYAPP_IMAGE
