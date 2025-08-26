#!/usr/bin/env bash
set -euo pipefail

# Resolve project root no matter where this script is called from
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_PATH/../.." && pwd)"
cd "$PROJECT_ROOT"

LOG_DIR="$PROJECT_ROOT/infra/logs"
mkdir -p "$LOG_DIR"

RESET=false
CLEANUP=false

# Parse flags
for arg in "$@"; do
  case $arg in
    --reset) RESET=true ;;
    --cleanup) CLEANUP=true ;;
  esac
done

echo "== TEST INFRA START $(date -u) =="

# 1. Refresh creds
echo "[1/3] Refreshing AWS credentials..."
"$PROJECT_ROOT/infra/scripts/refresh-creds.sh" || {
  echo "[ERROR] Failed to refresh or rotate AWS credentials."
  exit 1
}

# 2. Deploy infra
echo "[2/3] Deploying AWS infra (Lambda + DynamoDB)..."
"$PROJECT_ROOT/infra/scripts/deploy.sh" dev aws || {
  echo "[ERROR] Deployment failed."
  exit 1
}

# 3. Smoke test
echo "[3/3] Running smoke test..."
"$PROJECT_ROOT/infra/scripts/smoke.sh" || {
  echo "[ERROR] Smoke test failed."
  exit 1
}

# Optional cleanup/reset
if [ "$RESET" = true ]; then
  echo "[*] Resetting infra..."
  "$PROJECT_ROOT/infra/scripts/reset.sh" dev aws
elif [ "$CLEANUP" = true ]; then
  echo "[*] Cleaning up infra..."
  "$PROJECT_ROOT/infra/scripts/cleanup.sh"
fi

echo "== TEST INFRA END $(date -u) =="

# Friendly summary
API_URL=$(terraform -chdir="$PROJECT_ROOT/infra" output -raw api_url || echo "n/a")
DYNAMO_TABLE=$(terraform -chdir="$PROJECT_ROOT/infra" output -raw dynamodb_table || echo "n/a")

echo ""
echo "✅ Infra test complete!"
echo "-----------------------"
echo "API URL     : $API_URL"
echo "DynamoDB    : $DYNAMO_TABLE"
echo "Logs        : $LOG_DIR"
