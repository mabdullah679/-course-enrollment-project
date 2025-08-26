#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

LOG="$(logfile_path package)"
tee_log_start "$LOG"

zip_lambda
echo "== package END $(date -u) =="
echo "Log: $LOG"

