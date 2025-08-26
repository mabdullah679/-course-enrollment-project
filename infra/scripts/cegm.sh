#!/usr/bin/env bash
set -euo pipefail

# Master wrapper for modular workflows.
# USAGE:
#   scripts/cegm.sh package
#   scripts/cegm.sh deploy
#   scripts/cegm.sh smoke
#   scripts/cegm.sh destroy
#   scripts/cegm.sh redeploy          # destroy -> package -> deploy -> smoke
#   PROFILE=aws-cli-client REGION=us-east-1 scripts/cegm.sh deploy

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROFILE="${PROFILE:-default}"
export REGION="${REGION:-us-east-1}"

cmd="${1:-help}"

case "$cmd" in
  package)
    exec "$SCRIPT_DIR/package_lambda.sh"
    ;;
  deploy)
    exec "$SCRIPT_DIR/deploy_infra.sh"
    ;;
  smoke)
    exec "$SCRIPT_DIR/smoke_once.sh"
    ;;
  destroy)
    exec "$SCRIPT_DIR/destroy-infra.sh"
    ;;
  redeploy)
    # prove repeatability: destroy -> package -> deploy -> smoke
    "$SCRIPT_DIR/destroy-infra.sh"
    "$SCRIPT_DIR/package_lambda.sh"
    "$SCRIPT_DIR/deploy_infra.sh"
    exec "$SCRIPT_DIR/smoke_once.sh"
    ;;
  help|--help|-h)
    cat <<EOF
Usage: scripts/cegm.sh <command>

Commands:
  package   Package lambda/handler.py into infra/modules/aws/serverless_api/lambda.zip
  deploy    Terraform init+apply (uses PROFILE/REGION envs)
  smoke     Invoke Lambda, auto-extract smoke ID, get-item from DynamoDB, tail logs
  destroy   Terraform destroy (uses PROFILE/REGION envs)
  redeploy  Destroy -> package -> deploy -> smoke (repeatability proof)

Env vars:
  PROFILE   AWS profile to use (default: default)
  REGION    AWS region (default: us-east-1)

Examples:
  scripts/cegm.sh deploy
  PROFILE=aws-cli-client REGION=us-east-1 scripts/cegm.sh redeploy
EOF
    ;;
  *)
    echo "[ERROR] Unknown command: $cmd" >&2
    exit 1
    ;;
esac

