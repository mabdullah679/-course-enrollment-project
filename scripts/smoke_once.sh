#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

LOG="$(logfile_path smoke)"
tee_log_start "$LOG"

outputs_load
[[ -n "${FUNCTION_ARN:-}" && -n "${TABLE_NAME:-}" ]] || { echo "[ERROR] Missing outputs. Run deploy_infra.sh first."; exit 1; }

FN_NAME="$(lambda_name_from_arn "$FUNCTION_ARN")"
echo "Function: $FN_NAME"
echo "Table:    $TABLE_NAME"

invoke_lambda_smoke "$FN_NAME"
echo "SMOKE_ID=$SMOKE_ID"

echo "[ddb] get-item"
ddb_get_item_by_id "$TABLE_NAME" "$SMOKE_ID"

echo "[logs] tail"
logs_tail_lambda "$FN_NAME"

echo "== smoke END $(date -u) =="
echo "Log: $LOG"

