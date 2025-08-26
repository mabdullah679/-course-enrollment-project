#!/usr/bin/env bash
set -euo pipefail

LOG="infra/creds_$(date +%Y%m%d_%H%M%S).log"
PROFILE=${PROFILE:-aws-cli-client}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

{
  echo "== CREDS START $(date -u) =="
  echo "[*] Unsetting stale AWS_* env vars"
  unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE

  echo "[*] Loading keys from profile: $PROFILE"
  PROFILE="$PROFILE" bash "$SCRIPT_DIR/use-keys.sh"

  echo "[*] Verifying identity (STS)"
  if ! aws sts get-caller-identity --profile "$PROFILE"; then
    echo "[WARN] Credentials invalid, attempting rotation..."
    "$SCRIPT_DIR/rotate-key.sh"

    echo "[*] Re-loading keys from profile after rotation..."
    PROFILE="$PROFILE" bash "$SCRIPT_DIR/use-keys.sh"

    echo "[*] Re-validating identity (STS)"
    aws sts get-caller-identity --profile "$PROFILE" || {
      echo "[ERROR] Credentials still invalid after rotation"
      exit 1
    }
  fi
  echo "== CREDS END $(date -u) =="
} 2>&1 | tee "$LOG"

# macOS clipboard summary
printf "Profile: %s\nLog: %s\n" "$PROFILE" "$LOG" | tee -a "$LOG" | pbcopy
echo "[*] Summary copied to clipboard."
