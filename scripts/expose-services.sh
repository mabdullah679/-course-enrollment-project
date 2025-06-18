#!/bin/bash
# expose-services.sh
# Expose one or more studentapp-style services via port-forward + ngrok
# Usage:
#   ./expose-services.sh <service1> <service2> ...       → to expose
#   ./expose-services.sh --kill                          → to kill all tunnels + port-forwards started by this script

set -e

TUNNEL_LOG=tmp-ngrok-tunnels.log
PORT_BASE=9000

# -- KILL MODE
if [[ "$1" == "--kill" ]]; then
  echo "🛑 Killing all ngrok tunnels and port-forwards created by this script..."

  for port in $(seq $PORT_BASE 9100); do
    # Kill ngrok by process match
    NGROK_PID=$(pgrep -f "ngrok http $port" || true)
    if [ -n "$NGROK_PID" ]; then
      kill -9 "$NGROK_PID" && echo "☠️  Killed ngrok PID $NGROK_PID on port $port"
    fi

    # Kill kubectl port-forward by port
    PORTFWD_PID=$(lsof -ti :$port || true)
    if [ -n "$PORTFWD_PID" ]; then
      kill -9 "$PORTFWD_PID" && echo "✅ Killed port-forward PID $PORTFWD_PID on port $port"
    fi
  done

  echo "🧼 Cleaning logs..."
  rm -f /tmp/ngrok-*.log /tmp/portfwd-*.log "$TUNNEL_LOG"
  echo "🧹 Done."
  exit 0
fi

if [ "$#" -eq 0 ]; then
  echo "❌ No services passed. Usage: ./expose-services.sh <service1> <service2> ..."
  exit 1
fi

# -- Validate passed services exist in K8s
EXISTING_SERVICES=()
MISSING_SERVICES=()

for svc in "$@"; do
  if kubectl get svc "$svc" >/dev/null 2>&1; then
    EXISTING_SERVICES+=("$svc")
  else
    MISSING_SERVICES+=("$svc")
  fi

done

# -- Notify user of missing services
if [ ${#MISSING_SERVICES[@]} -gt 0 ]; then
  echo "⚠️ The following services were NOT found and will be skipped: ${MISSING_SERVICES[*]}"
fi

# -- Exit if no valid services
if [ ${#EXISTING_SERVICES[@]} -eq 0 ]; then
  echo "❌ No valid services to expose. Exiting."
  exit 1
fi

: > "$TUNNEL_LOG"

# -- Loop through each valid service
for index in "${!EXISTING_SERVICES[@]}"; do
  svc="${EXISTING_SERVICES[$index]}"
  port_offset=$((PORT_BASE + index))

  echo "🧼 Killing anything on port $port_offset for $svc..."

  # Kill ngrok specifically if running on this port
  NGROK_PID=$(pgrep -f "ngrok http $port_offset" || true)
  if [ -n "$NGROK_PID" ]; then
    kill -9 "$NGROK_PID" && echo "☠️  Killed ngrok PID $NGROK_PID"
  fi

  # Kill kubectl port-forward process
  PORTFWD_PID=$(lsof -ti :$port_offset || true)
  if [ -n "$PORTFWD_PID" ]; then
    kill -9 "$PORTFWD_PID" && echo "✅ Killed port-forward PID $PORTFWD_PID"
  fi

  echo "🚀 Port-forwarding $svc → localhost:$port_offset"
  kubectl port-forward svc/$svc $port_offset:8081 > "/tmp/portfwd-$svc.log" 2>&1 &
  sleep 2

  echo "🌐 Launching ngrok tunnel for $svc on :$port_offset"
  ngrok http $port_offset > "/tmp/ngrok-$svc.log" 2>&1 &
  sleep 3

  # Grab public URL
  PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.config.addr=="http://localhost:'$port_offset'") | .public_url')

  if [ -n "$PUBLIC_URL" ]; then
    echo "✅ $svc exposed at: $PUBLIC_URL"
    echo "$svc → $PUBLIC_URL" >> "$TUNNEL_LOG"
  else
    echo "❌ Failed to detect ngrok tunnel for $svc"
  fi

  sleep 1

done

# -- Summary
echo -e "\n📦 Exposure Summary (Dev Only):"
cat "$TUNNEL_LOG"
