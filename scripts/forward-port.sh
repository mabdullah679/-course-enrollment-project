#!/bin/bash

SERVICE_NAME=$1
ENDPOINT=${2:-/management/health}  # default if not passed
SERVICE_SLUG=$(echo "$SERVICE_NAME" | tr '[:upper:]' '[:lower:]')

if [ -z "$SERVICE_SLUG" ]; then
  echo "❌ Usage: ./scripts/forward-port.sh <ServiceName> [/optional/endpoint]"
  exit 1
fi

echo "🔍 Checking if pod for $SERVICE_SLUG is ready..."

RETRY_INTERVAL=5
MAX_RETRIES=12
ATTEMPTS=0

while [ $ATTEMPTS -lt $MAX_RETRIES ]; do
  POD_STATUS=$(kubectl get pods -l app=${SERVICE_SLUG} -o jsonpath="{.items[0].status.containerStatuses[0].ready}" 2>/dev/null)

  if [ "$POD_STATUS" == "true" ]; then
    echo "✅ $SERVICE_SLUG pod is ready. Starting port-forward..."
    break
  fi

  for ((i=RETRY_INTERVAL; i>0; i--)); do
    printf "\r⏳ %s not ready for port-forwarding. Rechecking in %ss... " "$SERVICE_NAME" "$i"
    sleep 1
  done

  ((ATTEMPTS++))
done

if [ $ATTEMPTS -eq $MAX_RETRIES ]; then
  echo -e "\n❌ Maximum retries reached. Pod is still not ready."
  ./scripts/check-health.sh "$SERVICE_NAME"
  exit 1
fi

POD=$(kubectl get pods -l app=${SERVICE_SLUG} -o jsonpath="{.items[0].metadata.name}")
echo ""
echo "🔁 Port-forwarding pod/$POD → localhost:8081"

kubectl port-forward pod/$POD 8081:8081 > /dev/null 2>&1 &
PF_PID=$!

sleep 3
echo "🌡️  Checking endpoint $ENDPOINT..."
./scripts/curl-endpoint.sh "$SERVICE_NAME" "$ENDPOINT"

kill $PF_PID > /dev/null 2>&1
