#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

LOG="$(logfile_path destroy)"
tee_log_start "$LOG"

tf_destroy
echo "== destroy END $(date -u) =="
echo "Log: $LOG"

