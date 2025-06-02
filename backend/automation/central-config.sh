#!/bin/bash

# ==========================================
# central-config.sh - Load shared env config
# ==========================================

# Load shared environment variables
ENV_FILE="$(dirname "$0")/../../.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "⚠️ .env file not found at $ENV_FILE"
  exit 1
fi

# Define services for which we expect image and port configurations
SERVICES=("CourseApp" "StudentApp" "GradeApp" "GatewayApp")
MISSING_VAR_FLAG=false

# Check and log service environment variable configurations
for SERVICE in "${SERVICES[@]}"; do
  SERVICE_LOWER=$(echo "$SERVICE" | tr '[:upper:]' '[:lower:]')
  SERVICE_UPPER=$(echo "$SERVICE" | tr '[:lower:]' '[:upper:]')

  IMAGE_VAR="${SERVICE_UPPER}_IMAGE"
  PORT_VAR="${SERVICE_UPPER}_PORT"

  if [ -z "${!IMAGE_VAR}" ]; then
    echo "❌ Missing configuration for ${IMAGE_VAR}"
    MISSING_VAR_FLAG=true
  fi

  if [ -z "${!PORT_VAR}" ]; then
    echo "❌ Missing configuration for ${PORT_VAR}"
    MISSING_VAR_FLAG=true
  fi
done

# Terminate script if any configuration is missing
if [ "$MISSING_VAR_FLAG" = true ]; then
  echo "⚠️ One or more required configurations are missing. Please check your .env file."
  exit 1
fi

# Log loaded configurations
echo "✅ Loaded configuration:"
echo "Spring profile: $SPRING_PROFILES_ACTIVE"
for SERVICE in "${SERVICES[@]}"; do
  SERVICE_UPPER=$(echo "$SERVICE" | tr '[:lower:]' '[:upper:]')
  IMAGE_VAR="${SERVICE_UPPER}_IMAGE"
  PORT_VAR="${SERVICE_UPPER}_PORT"
  echo "$SERVICE Image: ${!IMAGE_VAR}"
  echo "$SERVICE Port: ${!PORT_VAR}"
done
