#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "${HERE}/lib/common.sh"

LOGFILE="$(new_log smoke)"
info "Reading Terraform outputs" | tee -a "${LOGFILE}"

# Health check
info "[*] aws lambda invoke /health" | tee -a "${LOGFILE}"
HEALTH_EVT='{"rawPath":"/health","requestContext":{"http":{"method":"GET"}}}'
invoke_lambda_json "${HEALTH_EVT}" | tee -a "${LOGFILE}"
printf "\n" | tee -a "${LOGFILE}"

# Echo check
info "[*] aws lambda invoke /echo" | tee -a "${LOGFILE}"
ECHO_EVT='{"rawPath":"/echo","requestContext":{"http":{"method":"POST"}},"body":"{\"ping\":\"pong\"}"}'
invoke_lambda_json "${ECHO_EVT}" | tee -a "${LOGFILE}"
printf "\n" | tee -a "${LOGFILE}"

info "Smoke done" | tee -a "${LOGFILE}"
