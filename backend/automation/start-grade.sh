#!/bin/bash

# ================================
# start-grade.sh - Run GradeApp
# ================================

set -e

echo "🔄 Sourcing shared config..."
source ./backend/automation/central-config.sh

echo "🚀 Starting GradeApp container..."
docker run -it --rm \
  --name grade-app \
  --network course-enrollment-project_devnet \
  -e SPRING_PROFILES_ACTIVE=$SPRING_PROFILES_ACTIVE \
  -p $GRADEAPP_PORT:8080 \
  $GRADEAPP_IMAGE
