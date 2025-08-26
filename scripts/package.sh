#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; . "${HERE}/lib/common.sh"
LOGFILE="$(new_log package)"
info "Packaging Lambda..." | tee -a "${LOGFILE}"
HANDLER="${LAMBDA_DIR}/handler.py"
ZIP="${BUILD_DIR}/lambda.zip"
[ -f "${HANDLER}" ] || { err "Missing ${HANDLER}"; exit 1; }
rm -f "${ZIP}"
( cd "${LAMBDA_DIR}" && zip -q -r "${ZIP}" "$(basename "${HANDLER}")" ) || { err "zip failed"; exit 1; }
info "OK: ${ZIP}" | tee -a "${LOGFILE}"
