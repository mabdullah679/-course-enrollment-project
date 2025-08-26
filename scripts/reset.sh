#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV="${1:-dev}"
CLOUD="${2:-aws}"

echo "[*] Resetting infra for $ENV on $CLOUD ..."
"$SCRIPT_DIR/cleanup.sh"
"$SCRIPT_DIR/deploy.sh" "$ENV" "$CLOUD"
