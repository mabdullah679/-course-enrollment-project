#!/bin/bash

# === Usage ===
# ./check-health.sh studentapp short
# ./check-health.sh studentapp lengthy

SERVICE_NAME=$1
LOG_TYPE=${2:-short}

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="health-logs"
LOG_FILE="${LOG_DIR}/${SERVICE_NAME}-${TIMESTAMP}.log"

mkdir -p "$LOG_DIR"

echo "🔍 Checking health for service: $SERVICE_NAME"
echo "⏳ Fetching service IP via minikube..."

# Get dynamic service IP via minikube
CURL_IP=$(minikube service "$SERVICE_NAME" --url 2>/dev/null)

if [[ -z "$CURL_IP" ]]; then
  echo "❌ Failed to retrieve service URL for $SERVICE_NAME" | tee "$LOG_FILE"
  exit 1
fi

echo "🌐 Detected service URL: $CURL_IP"
echo "📁 Logs will be saved to: $LOG_FILE"
echo "⚙️ Running health check..."

# Run curl request
if [[ "$LOG_TYPE" == "short" ]]; then
  curl -s "${CURL_IP}/management/health" | jq '.status' | tee "$LOG_FILE"
else
  curl -s "${CURL_IP}/management/health" | jq '.' | tee "$LOG_FILE"
fi

echo -e "\n✅ Done."
echo "📄 Full log written to: $LOG_FILE"
echo "🔗 You may reuse CURL_IP: $CURL_IP"
