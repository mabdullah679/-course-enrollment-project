#!/bin/bash

# ===================================
# startup.sh - Start Local Dev System
# ===================================

set -e

PROJECT_ROOT="$HOME/course-enrollment-project"
CONFIG="$PROJECT_ROOT/backend/automation/central-config.sh"
HELM_DIR="$PROJECT_ROOT/helm"

echo "📂 Sourcing environment variables..."
if [ -f "$CONFIG" ]; then
  source "$CONFIG"
else
  echo "⚠️  Config file not found at $CONFIG — skipping..."
fi

echo "⎈ Starting local development system using Helm..."

# Deploy each Helm chart (you can loop if there are multiple services)
for service in gatewayApp studentApp gradeApp; do
  SERVICE_CHART="$HELM_DIR/$service"
  if [ -d "$SERVICE_CHART" ]; then
    echo "🚀 Deploying $service via Helm..."
    helm upgrade --install "$service" "$SERVICE_CHART"
  else
    echo "❌ Helm chart directory not found: $SERVICE_CHART"
  fi
done

echo "✅ Local system started using Helm."
