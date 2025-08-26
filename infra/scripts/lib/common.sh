#!/usr/bin/env bash
set -euo pipefail

# -------- Paths (location-agnostic) --------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TF_DIR="$PROJECT_ROOT/infra"
MOD_DIR="$TF_DIR/modules/aws/serverless_api"
LAMBDA_SRC_DIR="$PROJECT_ROOT/lambda"
LAMBDA_HANDLER="$LAMBDA_SRC_DIR/handler.py"
LAMBDA_ZIP="$MOD_DIR/lambda.zip"

# -------- Defaults --------
PROFILE="${PROFILE:-default}"
REGION="${REGION:-us-east-1}"

# -------- Helpers --------
require_cmd() {
  for c in "$@"; do
    command -v "$c" >/dev/null 2>&1 || { echo "[ERROR] Missing command: $c" >&2; exit 1; }
  done
}

logfile_path() {
  local base="${1:-run}"
  mkdir -p "$TF_DIR"
  echo "$TF_DIR/${base}_$(date -u +%Y%m%d_%H%M%S).log"
}

tee_log_start() {
  local log="$1"
  exec > >(tee -a "$log") 2>&1
  echo "== $(basename "$log" .log) START $(date -u) =="
}

outputs_load() {
  require_cmd terraform jq
  API_URL="$(terraform -chdir="$TF_DIR" output -raw api_url 2>/dev/null || true)"
  FUNCTION_ARN="$(terraform -chdir="$TF_DIR" output -raw lambda_function_arn 2>/dev/null || true)"
  TABLE_NAME="$(terraform -chdir="$TF_DIR" output -raw dynamodb_table 2>/dev/null || true)"
}

tf_init_apply() {
  require_cmd terraform
  terraform -chdir="$TF_DIR" init -reconfigure -upgrade
  terraform -chdir="$TF_DIR" apply -auto-approve -var profile="$PROFILE" -var region="$REGION"
}

tf_destroy() {
  require_cmd terraform
  terraform -chdir="$TF_DIR" destroy -auto-approve -var profile="$PROFILE" -var region="$REGION"
}

zip_lambda() {
  require_cmd zip
  [[ -f "$LAMBDA_HANDLER" ]] || { echo "[ERROR] Missing $LAMBDA_HANDLER"; exit 1; }
  mkdir -p "$MOD_DIR"
  (cd "$LAMBDA_SRC_DIR" && zip -q "$LAMBDA_ZIP" "$(basename "$LAMBDA_HANDLER")")
  echo "[ok] Packaged $LAMBDA_HANDLER -> $LAMBDA_ZIP"
}

lambda_name_from_arn() {
  local arn="$1"
  echo "${arn##*:function:}"
}

invoke_lambda_smoke() {
  require_cmd aws jq
  local fn_name="$1"
  local payload='{"body":"{\"ping\":\"pong\"}"}'
  local resp
  resp="$(aws lambda invoke \
    --function-name "$fn_name" \
    --payload "$payload" \
    --cli-binary-format raw-in-base64-out \
    /dev/stdout \
    --region "$REGION" --profile "$PROFILE")"
  echo "[invoke] $resp"
  local id
  id="$(echo "$resp" | jq -r '.body | fromjson | .id // empty')"
  [[ -n "$id" ]] || { echo "[ERROR] No smoke id in response"; return 1; }
  SMOKE_ID="$id"
  export SMOKE_ID
}

ddb_get_item_by_id() {
  require_cmd aws jq
  local table="$1" id="$2"
  aws dynamodb get-item \
    --table-name "$table" \
    --key "$(jq -n --arg id "$id" '{id:{S:$id}}')" \
    --region "$REGION" --profile "$PROFILE"
}

logs_tail_lambda() {
  require_cmd aws
  local fn_name="$1"
  aws logs tail "/aws/lambda/${fn_name}" --since 2m --format short --region "$REGION" --profile "$PROFILE"
}

