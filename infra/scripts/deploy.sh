#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INFRA_DIR="$PROJECT_ROOT/infra"

PROFILE=${PROFILE:-aws-cli-client}
ENV=${1:-dev}
CLOUD=${2:-aws}
TFVARS_FILE="$INFRA_DIR/tfvars/$CLOUD/free_first.tfvars"

export TF_PLUGIN_CACHE_DIR="${TF_PLUGIN_CACHE_DIR:-$HOME/.terraform.d/plugin-cache}"
mkdir -p "$TF_PLUGIN_CACHE_DIR"

echo "[DEBUG] Profile: $PROFILE"
echo "[DEBUG] Env: $ENV, Cloud: $CLOUD"
echo "[DEBUG] TFVARS: $TFVARS_FILE"
echo "[DEBUG] TF_PLUGIN_CACHE_DIR: $TF_PLUGIN_CACHE_DIR"

if [[ ! -f "$TFVARS_FILE" ]]; then
  echo "[ERROR] Expected tfvars file not found: $TFVARS_FILE"
  exit 1
fi

if [[ "$CLOUD" == "aws" ]]; then
  if ! aws sts get-caller-identity --profile "$PROFILE" >/dev/null 2>&1; then
    echo "[WARN] AWS profile invalid, rotating keys..."
    "$SCRIPT_DIR/rotate-key.sh"
  fi
  PROFILE="$PROFILE" source "$SCRIPT_DIR/use-keys.sh"
fi

# Clean local .terraform to avoid stale schema
rm -rf "$INFRA_DIR/.terraform"

terraform -chdir="$INFRA_DIR" init -upgrade -reconfigure

if [[ "$CLOUD" == "aws" ]]; then
  "$SCRIPT_DIR/injector.sh"
fi

PLAN_FILE="$INFRA_DIR/plan.out"
terraform -chdir="$INFRA_DIR" plan -var-file="$TFVARS_FILE" -out="$PLAN_FILE"
terraform -chdir="$INFRA_DIR" apply "$PLAN_FILE"

API_URL=$(terraform -chdir="$INFRA_DIR" output -raw api_url)
DYNAMO=$(terraform -chdir="$INFRA_DIR" output -raw dynamodb_table)
ARN=$(terraform -chdir="$INFRA_DIR" output -raw lambda_function_arn)

echo "API_URL: $API_URL"
echo "DynamoDB: $DYNAMO"
echo "Lambda ARN: $ARN"

if [[ "$CLOUD" == "aws" ]]; then
  echo "Testing Lambda health..."
  if terraform -chdir="$INFRA_DIR" output -json | jq -r '.public_access.value' | grep -q true; then
    curl -s "$API_URL/health" | jq .
  else
    aws lambda invoke \
      --function-name "$(basename "$ARN")" \
      --cli-binary-format raw-in-base64-out \
      --payload '{"rawPath":"/health","requestContext":{"http":{"method":"GET"}}}' \
      --profile "$PROFILE" \
      /dev/stdout | jq .
  fi
fi
