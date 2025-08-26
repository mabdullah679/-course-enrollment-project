#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INFRA_DIR="$PROJECT_ROOT/infra"

PROFILE=${PROFILE:-aws-cli-client}
USER_NAME=${USER_NAME:-aws-cli-client}
PLAN_FILE="$INFRA_DIR/plan.out"

terraform -chdir="$INFRA_DIR" plan -var-file="$INFRA_DIR/tfvars/aws/free_first.tfvars" -out="$PLAN_FILE"
SERVICES=$(terraform show -json "$PLAN_FILE" | jq -r '.planned_values.root_module.resources[].type' | sort -u)

echo "Detected services in this plan: $SERVICES"

POLICY=$(jq -n '{Version:"2012-10-17",Statement:[]}')
for SVC in $SERVICES; do
  case $SVC in
    aws_lambda_function)
      POLICY=$(echo $POLICY | jq '.Statement += [{"Effect":"Allow","Action":["lambda:*"],"Resource":"*"}]')
      ;;
    aws_dynamodb_table)
      POLICY=$(echo $POLICY | jq '.Statement += [{"Effect":"Allow","Action":["dynamodb:*"],"Resource":"*"}]')
      ;;
    aws_cloudwatch_log_group)
      POLICY=$(echo $POLICY | jq '.Statement += [{"Effect":"Allow","Action":["logs:*"],"Resource":"*"}]')
      ;;
  esac
done

echo $POLICY | jq . > "$INFRA_DIR/policy.json"

aws iam put-user-policy \
  --user-name "$USER_NAME" \
  --policy-name DynamicDeployerPolicy \
  --policy-document file://"$INFRA_DIR/policy.json" \
  --profile "$PROFILE"
