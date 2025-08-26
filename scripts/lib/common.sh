#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
INFRA_DIR="${REPO_ROOT}/infra"
SCRIPTS_DIR="${REPO_ROOT}/scripts"
LIB_DIR="${SCRIPTS_DIR}/lib"
TF_DIR="${INFRA_DIR}/terraform"
LAMBDA_DIR="${INFRA_DIR}/lambda"
BUILD_DIR="${INFRA_DIR}/build"
LOG_DIR="${INFRA_DIR}/logs"
mkdir -p "${BUILD_DIR}" "${LOG_DIR}"
ts() { date +"%Y-%m-%dT%H:%M:%S%z"; }
log() { printf "[%s] %s\n" "$(ts)" "$*"; }
info() { log "INFO  $*"; }
warn() { log "WARN  $*"; }
err() { log "ERROR $*" >&2; }
tee_log() { local msg="$1"; shift || true; local logfile="${1:-}"; [[ -n "${logfile}" ]] && printf "%s\n" "${msg}" | tee -a "${logfile}" || printf "%s\n" "${msg}"; }
require() { command -v "$1" >/dev/null 2>&1 || { err "Missing required tool: $1"; exit 127; }; }
require terraform; require aws; require jq; require zip; require unzip; require curl
tf() ( cd "${TF_DIR}" && terraform "$@" )
tf_output_raw() { ( cd "${TF_DIR}" && terraform output -raw "$1" ); }
aws_region_default() { printf "%s" "${AWS_REGION:-us-east-1}"; }
aws_profile_default() { printf "%s" "${AWS_PROFILE:-default}"; }
new_log() { local prefix="${1:-run}"; local stamp; stamp="$(date +%Y%m%d_%H%M%S)"; printf "%s/%s_%s.log" "${LOG_DIR}" "${prefix}" "${stamp}"; }
