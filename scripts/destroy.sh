#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; . "${HERE}/lib/common.sh"
LOGFILE="$(new_log destroy)"
warn "Destroying Terraform stack..." | tee -a "${LOGFILE}"
tf destroy -auto-approve | tee -a "${LOGFILE}"
info "Destroy complete" | tee -a "${LOGFILE}"
