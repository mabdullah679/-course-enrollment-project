#!/bin/bash

# ===============================
# start-course.sh - Run CourseApp
# ===============================

set -e

echo "🔄 Sourcing shared config..."
source ./backend/automation/central-config.sh

echo "🚀 Starting CourseApp container..."
docker run -it --rm \
  --name course-app \
  --network course-enrollment-project_devnet \
  -e SPRING_PROFILES_ACTIVE=$SPRING_PROFILES_ACTIVE \
  -p $COURSEAPP_PORT:8080 \
  $COURSEAPP_IMAGE
