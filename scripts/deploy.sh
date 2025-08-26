#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; . "${HERE}/lib/common.sh"
LOGFILE="$(new_log deploy)"
info "Terraform init/validate/plan/apply" | tee -a "${LOGFILE}"
tf init -upgrade | tee -a "${LOGFILE}"
tf validate | tee -a "${LOGFILE}"
tf plan -out="${BUILD_DIR}/tfplan" | tee -a "${LOGFILE}"
tf apply -auto-approve "${BUILD_DIR}/tfplan" | tee -a "${LOGFILE}"
info "Deploy complete" | tee -a "${LOGFILE}"
