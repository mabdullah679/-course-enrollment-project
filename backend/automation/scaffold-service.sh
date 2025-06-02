#!/bin/bash

# scaffold-service.sh
# Usage: ./scaffold-service.sh <serviceName>
# Must be run from anywhere — will cd internally.

set -e

PROJECT_ROOT=~/course-enrollment-project
BACKEND_DIR="$PROJECT_ROOT/backend"
SCRIPT_DIR="$BACKEND_DIR/automation"
TEMPLATE_YO_RC="$SCRIPT_DIR/template-yo-rc.json"

SERVICE_NAME="$1"

if [ -z "$SERVICE_NAME" ]; then
  echo "❌ Error: No service name provided."
  echo "Usage: ./scaffold-service.sh <serviceName>"
  exit 1
fi

SERVICE_DIR="$BACKEND_DIR/$SERVICE_NAME"

if [ ! -d "$SERVICE_DIR" ]; then
  echo "❌ Error: Directory $SERVICE_DIR does not exist."
  exit 1
fi

cd "$SERVICE_DIR"

# Step 1: Copy .yo-rc.json if needed
if [ ! -f ".yo-rc.json" ]; then
  if [ -f "$TEMPLATE_YO_RC" ]; then
    cp "$TEMPLATE_YO_RC" .yo-rc.json
    echo "ℹ️ Copied template .yo-rc.json into $SERVICE_NAME"

    # Dynamic updates to .yo-rc.json using jq
    SERVICE_NAME_LOWER=$(echo "$SERVICE_NAME" | tr '[:upper:]' '[:lower:]')
    jq --arg base "$SERVICE_NAME" \
       --arg pkg "com.mabdullah.courseapp.$SERVICE_NAME_LOWER" \
       --arg folder "com/mabdullah/courseapp/$SERVICE_NAME_LOWER" \
       --arg port "$(get_port "$SERVICE_NAME")" \
       '.["generator-jhipster"].baseName = $base |
        .["generator-jhipster"].packageName = $pkg |
        .["generator-jhipster"].packageFolder = $folder |
        .["generator-jhipster"].serverPort = $port' \
       .yo-rc.json > .yo-rc.json.tmp && mv .yo-rc.json.tmp .yo-rc.json
  else
    echo "❌ No .yo-rc.json found in $SERVICE_DIR and no template to copy."
    exit 1
  fi
fi

# Step 2: Scaffold
echo "🚀 Running JHipster scaffolding for $SERVICE_NAME..."
jhipster --defaults | tee "$SCRIPT_DIR/scaffold-$SERVICE_NAME.log"

# Step 3: Port rewrite logic
YML_PATH="src/main/resources/config/application-dev.yml"
case "$SERVICE_NAME" in
  gatewayApp)     PORT=8080 ;;
  studentApp)     PORT=8081 ;;
  courseApp)      PORT=8082 ;;
  gradeApp)       PORT=8083 ;;
  enrollmentApp)  PORT=8084 ;;
  *)
    echo "⚠️ Unknown service. Defaulting port to 8090"
    PORT=8090 ;;
esac

if [ -f "$YML_PATH" ]; then
  sed -i '' "s/port: 8080/port: $PORT/" "$YML_PATH"
  echo "🔁 Updated $SERVICE_NAME to use port $PORT in application-dev.yml"
else
  echo "❌ Could not find application-dev.yml to update port."
fi

echo "✅ Scaffold complete and port rewrite done for $SERVICE_NAME"
