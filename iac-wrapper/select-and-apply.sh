#!/usr/bin/env bash
set -euo pipefail

# Resolve project root
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CFG="$ROOT/iac-wrapper/iac.config.yaml"
MATRIX="$ROOT/iac-wrapper/validation-matrix.json"
TPL="$ROOT/iac-wrapper/preapply-summary.tpl.txt"

# --- Functions ---
render_summary() {
  sed \
    -e "s/{{project_name}}/${PROJECT_NAME}/g" \
    -e "s/{{provider}}/${PROVIDER}/g" \
    -e "s/{{deploy_type}}/${DEPLOY_TYPE}/g" \
    -e "s/{{env}}/${ENV}/g" \
    -e "s/{{region}}/${REGION}/g" \
    -e "s/{{budget_profile}}/${BUDGET}/g" \
    -e "s/{{compute_choice}}/${COMPUTE}/g" \
    -e "s/{{endpoint_choice}}/${ENDPOINT}/g" \
    -e "s/{{db_choice}}/${DB}/g" \
    -e "s/{{cdn_choice}}/${CDN}/g" \
    -e "s/{{public_endpoint_mode}}/public/g" \
    -e "s/{{cors_enabled}}/enabled/g" \
    -e "s/{{ttl_hours}}/${TTL_HOURS}/g" \
    -e "s/{{ttl_tag}}/${TTL_TAG}/g" \
    "$TPL"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1"; exit 1; }
}

# --- Dependency checks ---
require_cmd git
require_cmd jq
require_cmd terraform

# --- Defaults ---
PROJECT_NAME="$(awk '/project_name:/{print $2}' "$CFG" 2>/dev/null || echo course-enrollment-project)"
PROVIDER="${PROVIDER:-aws}"
DEPLOY_TYPE="${DEPLOY_TYPE:-serverless_api}"
ENV="${ENV:-dev}"
BUDGET="${BUDGET:-free_first}"
REGION="${REGION:-us-east-1}"
NAME_PREFIX="${NAME_PREFIX:-cegm}"
TTL_HOURS="${TTL_HOURS:-8}"
TTL_TAG="true"

# --- Lookup values from validation-matrix.json ---
if [[ "$PROVIDER" == "aws" ]]; then
  COMPUTE="$(jq -r '.budget_profiles.free_first.aws.compute' "$MATRIX")"
  ENDPOINT="$(jq -r '.budget_profiles.free_first.aws.endpoint' "$MATRIX")"
  DB="$(jq -r '.budget_profiles.free_first.aws.db' "$MATRIX")"
  CDN="$(jq -r '.budget_profiles.free_first.aws.cdn' "$MATRIX")"
elif [[ "$PROVIDER" == "gcp" ]]; then
  COMPUTE="$(jq -r '.budget_profiles.free_first.gcp.compute' "$MATRIX")"
  ENDPOINT="https_endpoint"
  DB="$(jq -r '.budget_profiles.free_first.gcp.db' "$MATRIX")"
  CDN="$(jq -r '.budget_profiles.free_first.gcp.cdn' "$MATRIX")"
else
  echo "Unsupported provider: $PROVIDER"
  exit 1
fi

# --- Output summary ---
echo
echo "=== Pre-apply summary (dry-run) ==="
render_summary
echo
echo "[DRY RUN] Skipping terraform plan/apply because modules are stubs."
