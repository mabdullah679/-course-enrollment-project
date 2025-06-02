#!/bin/bash

SERVICE_NAME=$1
ENDPOINT=$2
AUTH_REQUIRED=${3:-true}  # default to "true" if not provided

if [ -z "$SERVICE_NAME" ] || [ -z "$ENDPOINT" ]; then
  echo "❌ Usage: ./scripts/curl-endpoint.sh <ServiceName> <Endpoint> [auth_required:true|false]"
  exit 1
fi

SERVICE_SLUG=$(echo "$SERVICE_NAME" | tr '[:upper:]' '[:lower:]')
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_PATH="$PROJECT_ROOT/backend/$SERVICE_NAME/src/main/resources/config/application-dev.yml"

if [ "$AUTH_REQUIRED" == "true" ]; then
  if [ ! -f "$CONFIG_PATH" ]; then
    echo "❌ Config not found at $CONFIG_PATH"
    exit 1
  fi

  TOKEN=$(yq -r '.authentication.jwt.secret' "$CONFIG_PATH")
  if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo "❌ Failed to extract JWT secret from $CONFIG_PATH"
    exit 1
  fi

  echo "🔐 Curling http://localhost:8081$ENDPOINT (with auth)"
  curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8081$ENDPOINT"
else
  echo "🌐 Curling http://localhost:8081$ENDPOINT (no auth)"
  curl -s "http://localhost:8081$ENDPOINT"
fi
