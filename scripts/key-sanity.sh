#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; . "${HERE}/lib/common.sh"
info "Profile=${AWS_PROFILE:-aws-cli-client} Region=${AWS_REGION:-us-east-1}"
aws sts get-caller-identity | tee >(cat >&2)
aws lambda list-functions --max-items 1 >/dev/null 2>&1 || warn "lambda:list-functions not permitted"
aws dynamodb list-tables --max-items 1 >/dev/null 2>&1 || warn "dynamodb:list-tables not permitted"
info "Key sanity check done."
