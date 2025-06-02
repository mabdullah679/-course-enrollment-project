#!/bin/bash

SERVICE_NAME=$1
SERVICE_SLUG=$(echo "$SERVICE_NAME" | tr '[:upper:]' '[:lower:]')
LOG_FILE="logs/${SERVICE_SLUG}-debug.log"

if [ -z "$SERVICE_NAME" ]; then
  echo "❌ Usage: ./scripts/debug-pod.sh <ServiceName>"
  exit 1
fi

mkdir -p logs

POD_NAME=$(kubectl get pods -l app=${SERVICE_SLUG} -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)

if [ -z "$POD_NAME" ]; then
  echo "❌ Could not find a pod for $SERVICE_NAME" | tee "$LOG_FILE"
  exit 1
fi

echo "🔍 Debugging pod: $POD_NAME" | tee "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "📋 Describe output:" | tee -a "$LOG_FILE"
kubectl describe pod "$POD_NAME" 2>&1 | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
echo "🧾 Logs output:" | tee -a "$LOG_FILE"
kubectl logs "$POD_NAME" 2>&1 | tee -a "$LOG_FILE"

echo "✅ Debug info dumped to $LOG_FILE"
