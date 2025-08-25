#!/usr/bin/env bash
set -euo pipefail

USER_NAME=${USER_NAME:-aws-cli-client}
PROFILE=${PROFILE:-aws-cli-client}

echo "[*] Rotating keys for $USER_NAME..."

NEW_KEYS=$(aws iam create-access-key --user-name "$USER_NAME" --profile "$PROFILE")
NEW_ID=$(echo "$NEW_KEYS"   | jq -r '.AccessKey.AccessKeyId')
NEW_SECRET=$(echo "$NEW_KEYS" | jq -r '.AccessKey.SecretAccessKey')

aws configure set aws_access_key_id     "$NEW_ID"    --profile "$PROFILE"
aws configure set aws_secret_access_key "$NEW_SECRET" --profile "$PROFILE"

OLD_KEYS=$(aws iam list-access-keys --user-name "$USER_NAME" --profile "$PROFILE" | jq -r '.AccessKeyMetadata[].AccessKeyId')
for KEY in $OLD_KEYS; do
  if [ "$KEY" != "$NEW_ID" ]; then
    aws iam delete-access-key --user-name "$USER_NAME" --access-key-id "$KEY" --profile "$PROFILE"
  fi
done

echo "[*] Key rotation complete for $USER_NAME."
