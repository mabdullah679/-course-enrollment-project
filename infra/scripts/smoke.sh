#!/usr/bin/env bash
set -euo pipefail

PROFILE=${PROFILE:-aws-cli-client}
LOG="infra/smoke_$(date +%Y%m%d_%H%M%S).log"

# mirror stdout+stderr to both terminal and log, without a subshell
exec > >(tee "$LOG") 2>&1

echo "== SMOKE START $(date -u) =="

API_URL="$(terraform -chdir=infra output -raw api_url)"
ARN="$(terraform -chdir=infra output -raw lambda_function_arn)"
PUB="$(terraform -chdir=infra output -json | jq -r '.public_access.value // false')"

echo "API_URL=$API_URL"
echo "LAMBDA_ARN=$ARN"
echo "PUBLIC_ACCESS=$PUB"

if [ "$PUB" = "true" ]; then
  echo "[*] curl /health"
  HEALTH_RESP="$(curl -s "$API_URL/health")"
  echo "$HEALTH_RESP"
else
  echo "[*] aws lambda invoke /health"
  HEALTH_RESP="$(aws lambda invoke \
    --function-name "$(basename "$ARN")" \
    --cli-binary-format raw-in-base64-out \
    --payload '{"rawPath":"/health","requestContext":{"http":{"method":"GET"}}}' \
    --profile "$PROFILE" \
    /dev/stdout)"
  echo "$HEALTH_RESP"
fi

echo "== SMOKE END $(date -u) =="

# macOS clipboard summary
printf "API_URL: %s\nLAMBDA_ARN: %s\nLog: %s\n" "$API_URL" "$ARN" "$LOG" | tee -a "$LOG" | pbcopy
echo "[*] Smoke summary copied to clipboard."
