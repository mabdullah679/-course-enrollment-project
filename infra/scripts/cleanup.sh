#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

AWS_PROFILE=${AWS_PROFILE:-aws-cli-client}
REGION="us-east-1"
PREFIX="cegm"

# Ensure environment creds match the profile (prevents stale env vars)
PROFILE="$AWS_PROFILE" source "$SCRIPT_DIR/use-keys.sh"

echo "[*] Pre-flight AWS identity check..."
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" >/dev/null 2>&1; then
  echo "[ERROR] Invalid AWS profile/token ($AWS_PROFILE)"
  exit 1
fi

echo "[*] Cleaning up old AWS resources for $PREFIX in $REGION..."

aws lambda delete-function \
  --function-name "${PREFIX}-lambda" \
  --region "$REGION" --profile "$AWS_PROFILE" || true

aws lambda delete-function-url-config \
  --function-name "${PREFIX}-lambda" \
  --region "$REGION" --profile "$AWS_PROFILE" || true

for stmt in AllowExecRoleInvoke AllowAccountInvoke; do
  aws lambda remove-permission \
    --function-name "${PREFIX}-lambda" \
    --statement-id "$stmt" \
    --region "$REGION" --profile "$AWS_PROFILE" || true
done

aws dynamodb delete-table \
  --table-name "${PREFIX}-events" \
  --region "$REGION" --profile "$AWS_PROFILE" || true

aws logs delete-log-group \
  --log-group-name "/aws/lambda/${PREFIX}-lambda" \
  --region "$REGION" --profile "$AWS_PROFILE" || true

aws iam detach-role-policy \
  --role-name "${PREFIX}-lambda-exec" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  --profile "$AWS_PROFILE" || true

aws iam delete-role-policy \
  --role-name "${PREFIX}-lambda-exec" \
  --policy-name "${PREFIX}-lambda-dynamo" \
  --profile "$AWS_PROFILE" || true

aws iam delete-role \
  --role-name "${PREFIX}-lambda-exec" \
  --profile "$AWS_PROFILE" || true

echo "[*] Cleanup complete."
