#!/usr/bin/env bash
set -euo pipefail

# === Resolve paths ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INFRA_DIR="$PROJECT_ROOT/infra"

ENV_NAME="${1:-dev}"
CLOUD="${2:-aws}"

PROFILE="${PROFILE:-aws-cli-client}"
export TF_PLUGIN_CACHE_DIR="${TF_PLUGIN_CACHE_DIR:-$HOME/.terraform.d/plugin-cache}"

echo "[DEBUG] Profile: $PROFILE"
echo "[DEBUG] Env: $ENV_NAME, Cloud: $CLOUD"

# === Choose tfvars ===
if [[ "$CLOUD" == "aws" ]]; then
  TFVARS="$INFRA_DIR/tfvars/aws/free_first.tfvars"
elif [[ "$CLOUD" == "gcp" ]]; then
  TFVARS="$INFRA_DIR/tfvars/gcp/free_first.tfvars"
else
  echo "[ERROR] Unknown cloud '$CLOUD'"
  exit 1
fi
echo "[DEBUG] TFVARS: $TFVARS"
echo "[DEBUG] TF_PLUGIN_CACHE_DIR: $TF_PLUGIN_CACHE_DIR"

mkdir -p "$TF_PLUGIN_CACHE_DIR"

# === Check Terraform version (recommend >= 1.13) ===
TFV="$(terraform version | head -n1 | awk '{print $2}' | tr -d 'v')"
# Basic semver compare: require 1.13.0+
TF_MAJOR="${TFV%%.*}"
TF_MINOR="${TFV#*.}"; TF_MINOR="${TF_MINOR%%.*}"
if [[ "${TF_MAJOR:-0}" -eq 1 && "${TF_MINOR:-0}" -lt 13 ]]; then
  echo "[WARN] Terraform $TFV detected. Providers (aws 5.100+) can fail to load on older TF."
  echo "[WARN] Please upgrade to Terraform >= 1.13.x for best compatibility."
fi

# === Load AWS creds into env ===
echo "[*] Loading AWS credentials for profile: $PROFILE"
PROFILE="$PROFILE" bash "$SCRIPT_DIR/use-keys.sh"

PLAN_PATH="$INFRA_DIR/plan.out"

# === macOS quarantine cleanup (best-effort) ===
if command -v xattr >/dev/null 2>&1; then
  xattr -dr com.apple.quarantine "$HOME/.terraform.d/plugin-cache" 2>/dev/null || true
  xattr -dr com.apple.quarantine "$INFRA_DIR/.terraform" 2>/dev/null || true
fi

run_plan_and_apply() {
  terraform -chdir="$INFRA_DIR" init -upgrade -reconfigure

  terraform -chdir="$INFRA_DIR" plan \
    -var-file="$TFVARS" \
    -out "$PLAN_PATH"

  terraform -chdir="$INFRA_DIR" apply -auto-approve "$PLAN_PATH"
}

# === First attempt ===
set +e
APPLY_OUTPUT="$(run_plan_and_apply 2>&1)"
APPLY_STATUS=$?
set -e

if [[ $APPLY_STATUS -ne 0 ]]; then
  echo "$APPLY_OUTPUT"

  # Detect provider schema load failure
  if echo "$APPLY_OUTPUT" | grep -qi "Failed to load plugin schemas"; then
    echo "[WARN] Provider schema load failure detected. Re-initializing providers and retrying once..."
    rm -rf "$INFRA_DIR/.terraform"
    if command -v xattr >/dev/null 2>&1; then
      xattr -dr com.apple.quarantine "$HOME/.terraform.d/plugin-cache" 2>/dev/null || true
      xattr -dr com.apple.quarantine "$INFRA_DIR/.terraform" 2>/dev/null || true
    fi

    set +e
    APPLY_OUTPUT_RETRY="$(run_plan_and_apply 2>&1)"
    APPLY_STATUS_RETRY=$?
    set -e

    if [[ $APPLY_STATUS_RETRY -ne 0 ]]; then
      echo "$APPLY_OUTPUT_RETRY"
      echo "[ERROR] Deployment failed again after provider re-init."
      exit $APPLY_STATUS_RETRY
    fi
  else
    echo "[ERROR] Deployment failed."
    exit $APPLY_STATUS
  fi
fi

echo
echo "Outputs:"
terraform -chdir="$INFRA_DIR" output || true
