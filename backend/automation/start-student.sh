#!/bin/bash

# ================================
# start-student.sh - Run StudentApp
# ================================

set -e

echo "🔄 Sourcing shared config..."
source ./backend/automation/central-config.sh

echo "🚀 Starting StudentApp container..."
docker run -it --rm \
  --name student-app \
  --network course-enrollment-project_devnet \
  -e SPRING_PROFILES_ACTIVE=$SPRING_PROFILES_ACTIVE \
  -p $STUDENTAPP_PORT:8080 \
  $STUDENTAPP_IMAGE
