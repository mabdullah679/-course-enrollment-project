#!/usr/bin/env bash
set -euo pipefail

PROFILE=${PROFILE:-aws-cli-client}

echo "[*] Loading AWS credentials for profile: $PROFILE"

AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id --profile "$PROFILE")
AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key --profile "$PROFILE")

if [[ -z "${AWS_ACCESS_KEY_ID:-}" || -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  echo "[ERROR] Could not fetch keys from profile $PROFILE"
  exit 1
fi

export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
unset AWS_SESSION_TOKEN

echo "[*] Exported AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY into env"
