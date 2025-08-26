#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; . "${HERE}/lib/common.sh"
LOGFILE="$(new_log smoke)"
info "Reading Terraform outputs" | tee -a "${LOGFILE}"
API_URL="$(tf_output_raw api_url 2>/dev/null || true)"
LAMBDA_ARN="$(tf_output_raw lambda_function_arn 2>/dev/null || true)"
DDB_TABLE="$(tf_output_raw dynamodb_table 2>/dev/null || true)"
[ -n "${API_URL}" ] || { err "Missing output: api_url"; exit 2; }
[ -n "${LAMBDA_ARN}" ] || warn "Missing output: lambda_function_arn"
[ -n "${DDB_TABLE}" ] || warn "Missing output: dynamodb_table"
REGION="$(aws_region_default)"
info "[*] curl --aws-sigv4 ${REGION} ${API_URL}/health" | tee -a "${LOGFILE}"
curl --silent --fail --aws-sigv4 "aws:amz:${REGION}:lambda" "${API_URL}/health" | tee -a "${LOGFILE}"
printf "\n" | tee -a "${LOGFILE}"
info "[*] POST /echo" | tee -a "${LOGFILE}"
curl --silent --fail --aws-sigv4 "aws:amz:${REGION}:lambda" -H "Content-Type: application/json" -d '{"ping":"pong"}' "${API_URL}/echo" | tee -a "${LOGFILE}"
printf "\n" | tee -a "${LOGFILE}"
info "Smoke done" | tee -a "${LOGFILE}"
