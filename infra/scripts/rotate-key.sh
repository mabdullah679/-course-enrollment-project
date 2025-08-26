#!/usr/bin/env bash
set -euo pipefail

USER_NAME=${USER_NAME:-aws-cli-client}
PROFILE=${PROFILE:-aws-cli-client}

echo "[*] Rotating keys for $USER_NAME..."

# Clear stale env vars
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE

# List existing keys sorted by create date
EXISTING_KEYS=$(aws iam list-access-keys \
  --user-name "$USER_NAME" \
  --profile "$PROFILE" \
  --query 'AccessKeyMetadata[*].{ID:AccessKeyId,Create:CreateDate}' \
  --output json | jq -c '. | sort_by(.Create)')

COUNT=$(echo "$EXISTING_KEYS" | jq 'length')

# If at quota (2 keys), delete the oldest
if [ "$COUNT" -ge 2 ]; then
  OLDEST_KEY=$(echo "$EXISTING_KEYS" | jq -r '.[0].ID')
  echo "[*] Deleting oldest key: $OLDEST_KEY"
  aws iam delete-access-key \
    --user-name "$USER_NAME" \
    --access-key-id "$OLDEST_KEY" \
    --profile "$PROFILE"
fi

# Create new key
NEW_KEYS=$(aws iam create-access-key --user-name "$USER_NAME" --profile "$PROFILE")
NEW_ID=$(echo "$NEW_KEYS"   | jq -r '.AccessKey.AccessKeyId')
NEW_SECRET=$(echo "$NEW_KEYS" | jq -r '.AccessKey.SecretAccessKey')

# Update AWS CLI profile
aws configure set aws_access_key_id     "$NEW_ID"    --profile "$PROFILE"
aws configure set aws_secret_access_key "$NEW_SECRET" --profile "$PROFILE"

# Validate via profile with retries
echo "[*] Validating new credentials via profile..."
MAX_RETRIES=5
for i in $(seq 1 $MAX_RETRIES); do
  if aws sts get-caller-identity --profile "$PROFILE" >/dev/null 2>&1; then
    echo "[*] Validation successful on attempt $i"
    break
  fi
  echo "[WARN] Validation failed (attempt $i/$MAX_RETRIES), retrying..."
  sleep 3
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "[ERROR] New credentials failed validation after $MAX_RETRIES attempts!"
    exit 1
  fi
done

# Export into current shell
export AWS_ACCESS_KEY_ID="$NEW_ID"
export AWS_SECRET_ACCESS_KEY="$NEW_SECRET"
unset AWS_SESSION_TOKEN
echo "[*] Exported new credentials into current shell"

echo "[*] Key rotation complete. Active key: $NEW_ID"
