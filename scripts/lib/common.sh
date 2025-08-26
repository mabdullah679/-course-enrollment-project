#!/usr/bin/env bash
set -euo pipefail

# ---------- Paths ----------
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
INFRA_DIR="${REPO_ROOT}/infra"
SCRIPTS_DIR="${REPO_ROOT}/scripts"
LIB_DIR="${SCRIPTS_DIR}/lib"
LAMBDA_DIR="${INFRA_DIR}/lambda"
BUILD_DIR="${INFRA_DIR}/build"
LOG_DIR="${INFRA_DIR}/logs"
mkdir -p "${BUILD_DIR}" "${LOG_DIR}"

# ---------- Logging ----------
ts() { date +"%Y-%m-%dT%H:%M:%S%z"; }
log() { printf "[%s] %s\n" "$(ts)" "$*"; }
info() { log "INFO  $*"; }
warn() { log "WARN  $*"; }
err() { log "ERROR $*" >&2; }

# ---------- Prereqs ----------
require() { command -v "$1" >/dev/null 2>&1 || { err "Missing required tool: $1"; exit 127; }; }
require terraform; require aws; require jq; require zip; require unzip; require curl

# ---------- Terraform dir detection ----------
_detect_tf_dir() {
  for d in "${INFRA_DIR}/terraform" "${INFRA_DIR}" "${REPO_ROOT}/terraform" "${REPO_ROOT}"; do
    if find "$d" -maxdepth 1 -type f -name '*.tf' 2>/dev/null | grep -q .; then
      printf "%s" "$d"; return 0
    fi
  done
  printf "%s" "${INFRA_DIR}/terraform"
}
TF_DIR="$(_detect_tf_dir)"

# ---------- Terraform helpers ----------
tf() ( info "Terraform dir: ${TF_DIR}"; cd "${TF_DIR}" && terraform "$@" )
tf_output_raw() { ( cd "${TF_DIR}" && terraform output -raw "$1" ); }

# ---------- AWS helpers ----------
aws_region_default()  { printf "%s" "${AWS_REGION:-us-east-1}"; }
aws_profile_default() { printf "%s" "${AWS_PROFILE:-default}"; }

# ---------- Log file helpers ----------
new_log() { local prefix="${1:-run}"; local stamp; stamp="$(date +%Y%m%d_%H%M%S)"; printf "%s/%s_%s.log" "${LOG_DIR}" "${prefix}" "${stamp}"; }

# ---------- Lambda invoke helpers ----------
lambda_arn()  { tf_output_raw lambda_function_arn 2>/dev/null || true; }
lambda_name() { local arn; arn="$(lambda_arn)"; [ -n "$arn" ] && printf "%s" "${arn##*:function:}" || printf "cegm-%s-lambda" "$(tf_output_raw env 2>/dev/null || echo dev)"; }

invoke_lambda_json() { # args: <json-string>
  local payload="$1"; local fn; fn="$(lambda_name)"
  aws lambda invoke --function-name "$fn" \
    --payload "$payload" \
    --cli-binary-format raw-in-base64-out \
    /dev/stdout
}
