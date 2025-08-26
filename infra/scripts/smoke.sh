#!/usr/bin/env bash
set -euo pipefail

# Resolve project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TF_DIR="$PROJECT_ROOT/infra"
PROFILE=${1:-default}
REGION=${2:-us-east-1}
LOG="$TF_DIR/smoke_$(date -u +%Y%m%d_%H%M%S).log"

exec > >(tee "$LOG") 2>&1

echo "== SMOKE START $(date -u) =="

API_URL="$(terraform -chdir="$TF_DIR" output -raw api_url)"
ARN="$(terraform -chdir="$TF_DIR" output -raw lambda_function_arn)"
TABLE="$(terraform -chdir="$TF_DIR" output -raw dynamodb_table)"

echo "API_URL=$API_URL"
echo "LAMBDA_ARN=$ARN"
echo "TABLE=$TABLE"

# Invoke Lambda via AWS CLI (safe regardless of public_access)
RESP="$(aws lambda invoke \
  --function-name "$(basename "$ARN")" \
  --cli-binary-format raw-in-base64-out \
  --payload '{"body":"{\"ping\":\"pong\"}"}' \
  --profile "$PROFILE" --region "$REGION" \
  /dev/stdout)"

echo "[lambda] $RESP"

SMOKE_ID="$(echo "$RESP" | jq -r '.body | fromjson | .id')"
echo "SMOKE_ID=$SMOKE_ID"

# Confirm in DynamoDB
aws dynamodb get-item \
  --table-name "$TABLE" \
  --key "{\"id\":{\"S\":\"$SMOKE_ID\"}}" \
  --profile "$PROFILE" --region "$REGION"

# Tail logs
aws logs tail "/aws/lambda/$(basename "$ARN")" \
  --since 2m --profile "$PROFILE" --region "$REGION"

echo "== SMOKE END $(date -u) =="
