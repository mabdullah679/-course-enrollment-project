#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "${HERE}/lib/common.sh"

LOGFILE="$(new_log smoke)"
info "Reading Terraform outputs" | tee -a "${LOGFILE}"

API_URL="$(tf_output_raw api_url 2>/dev/null || true)"
API_URL="${API_URL%/}"
REGION="$(aws_region_default)"

# ---------- Health ----------
HTTP_CODE="000"
if [ -n "${API_URL:-}" ]; then
  info "[*] GET ${API_URL}/health (signed)" | tee -a "${LOGFILE}"
  HTTP_CODE="$(curl --silent --show-error --write-out "%{http_code}" --output /tmp/health.out \
    --max-time 10 --aws-sigv4 "aws:amz:${REGION}:lambda" "${API_URL}/health" || echo "000")"
  cat /tmp/health.out | tee -a "${LOGFILE}"; printf "\n" | tee -a "${LOGFILE}"
else
  warn "Missing api_url output, skipping URL health" | tee -a "${LOGFILE}"
fi

if [ "${HTTP_CODE}" != "200" ]; then
  warn "Health via URL returned ${HTTP_CODE}, falling back to aws lambda invoke" | tee -a "${LOGFILE}"
  HEALTH_EVT='{"rawPath":"/health","requestContext":{"http":{"method":"GET"}}}'
  invoke_lambda_json "${HEALTH_EVT}" | tee -a "${LOGFILE}"; printf "\n" | tee -a "${LOGFILE}"
fi

# ---------- Echo ----------
HTTP_CODE="000"
info "[*] POST /echo" | tee -a "${LOGFILE}"
if [ -n "${API_URL:-}" ]; then
  HTTP_CODE="$(curl --silent --show-error --write-out "%{http_code}" --output /tmp/echo.out \
    --max-time 10 --aws-sigv4 "aws:amz:${REGION}:lambda" \
    -H "Content-Type: application/json" -d '{"ping":"pong"}' "${API_URL}/echo" || echo "000")"
  cat /tmp/echo.out | tee -a "${LOGFILE}"; printf "\n" | tee -a "${LOGFILE}"
fi

if [ "${HTTP_CODE}" != "200" ]; then
  warn "Echo via URL returned ${HTTP_CODE}, falling back to aws lambda invoke" | tee -a "${LOGFILE}"
  ECHO_EVT='{"rawPath":"/echo","requestContext":{"http":{"method":"POST"}},"body":"{\"ping\":\"pong\"}"}'
  invoke_lambda_json "${ECHO_EVT}" | tee -a "${LOGFILE}"; printf "\n" | tee -a "${LOGFILE}"
fi

info "Smoke done" | tee -a "${LOGFILE}"
