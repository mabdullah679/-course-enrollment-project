#!/usr/bin/env bash
set -euo pipefail

LOG="infra/creds_$(date +%Y%m%d_%H%M%S).log"
PROFILE=${PROFILE:-aws-cli-client}

{
  echo "== CREDS START $(date -u) =="
  echo "[*] Unsetting stale AWS_* env vars"
  unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE

  echo "[*] Loading keys from profile: $PROFILE"
  PROFILE="$PROFILE" bash ./infra/scripts/use-keys.sh

  echo "[*] Verifying identity (STS)"
  aws sts get-caller-identity --profile "$PROFILE"
  echo "== CREDS END $(date -u) =="
} 2>&1 | tee "$LOG"

# macOS clipboard
printf "Profile: %s\nLog: %s\n" "$PROFILE" "$LOG" | tee -a "$LOG" | pbcopy
echo "[*] Summary copied to clipboard."

