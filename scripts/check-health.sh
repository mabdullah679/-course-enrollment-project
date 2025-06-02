#!/bin/bash

SERVICE_NAME=$1
SERVICE_SLUG=$(echo "$SERVICE_NAME" | tr '[:upper:]' '[:lower:]')
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/health-check.log"
ARCHIVE_FILE="$LOG_DIR/health-check-$TIMESTAMP.log"

mkdir -p "$LOG_DIR"

# Archive previous log
[ -f "$LOG_FILE" ] && mv "$LOG_FILE" "$ARCHIVE_FILE"

POD_NAME=$(kubectl get pods -l app=${SERVICE_SLUG} -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)

{
  echo "🩺 Health Check - $SERVICE_NAME [$TIMESTAMP]"
  echo "---------------------------------------------"
  
  if [ -z "$POD_NAME" ]; then
    echo "❌ Pod not found for label: app=${SERVICE_SLUG}"
    echo "📍 Issue: pod never created or Helm release failed"
    exit 0
  fi

  echo "📦 Pod Name: $POD_NAME"

  echo -n "📌 Status: "
  kubectl get pod "$POD_NAME" -o=jsonpath="{.status.phase}" || echo "Unknown"

  echo -n "🔁 Restart Count: "
  kubectl get pod "$POD_NAME" -o=jsonpath="{.status.containerStatuses[0].restartCount}" || echo "Unknown"

  echo -n "🧪 Ready Status: "
  kubectl get pod "$POD_NAME" -o=jsonpath="{.status.containerStatuses[0].ready}" || echo "Unknown"

  echo ""
  echo "🔍 Last 10 log lines:"
  kubectl logs "$POD_NAME" --tail=10 2>&1 || echo "Unable to fetch logs"

} > "$LOG_FILE"

# Print the final issue summary to terminal
echo ""
echo "📄 Latest health log: $LOG_FILE"
ISSUE_LINE=$(grep -m 1 '❌\|📍 Issue' "$LOG_FILE" || true)

if [ -n "$ISSUE_LINE" ]; then
  echo "⚠️  This is the issue: ${ISSUE_LINE#* }"
else
  echo "✅ Pod exists. Check logs for runtime errors or crash loops."
fi
