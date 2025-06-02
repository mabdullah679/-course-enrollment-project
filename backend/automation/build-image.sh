#!/bin/bash

# ==========================================
# build-image.sh - Build Docker Images
# ==========================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SOURCE_DIR="$PROJECT_ROOT/backend"
AUTOMATION_DIR="$SOURCE_DIR/automation"

check_in_project_root() {
  if [ ! -d "$AUTOMATION_DIR" ]; then
    echo "❌ This script must be run inside the project directory."
    exit 1
  fi
}

check_in_project_root

SERVICE_NAME=$1
DOCKER_USERNAME="your-docker-hub-username"

if [ -z "$SERVICE_NAME" ]; then
  echo "❌ Usage: ./backend/automation/build-image.sh <ServiceName|all>"
  exit 1
fi

# Ensure we're using Minikube's Docker context
if ! docker info | grep -q "Minikube"; then
  echo "⚠️ Warning: Docker context may not be Minikube. Run: eval \"\$(minikube docker-env)\""
fi
eval "$(minikube docker-env)"

# Check if Docker is logged in
if ! docker info | grep -q "Username:"; then
  echo "👤 Oop - Log into Docker via 'docker login' and try again!"
  exit 1
fi

build_and_push() {
  local service=$1
  local image_var="${service}_IMAGE" # Use literal variable naming if direct mapping is required
  local path="$SOURCE_DIR/$service"
  local image_name="${!image_var}"

  if [ ! -d "$path" ]; then
    echo "❌ Directory for $service not found, skipping..."
    return
  fi

  echo "🔨 Building Docker image for $service..."
  docker build -t "$image_name" "$path"

  echo "🚀 Pushing Docker image for $service to Docker Hub..."
  docker tag "$image_name" "$DOCKER_USERNAME/$image_name"
  docker push "$DOCKER_USERNAME/$image_name"
}

if [[ "$SERVICE_NAME" == "all" ]]; then
  services=("courseApp" "studentApp" "gradeApp" "gatewayApp")
  for service in "${services[@]}"; do
    build_and_push "$service"
  done
  echo "✅ All services built and pushed."
else
  build_and_push "$SERVICE_NAME"
  echo "✅ Service '$SERVICE_NAME' built and pushed."
fi