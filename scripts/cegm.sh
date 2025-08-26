#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "${HERE}/lib/common.sh"
usage() { cat <<USAGE
Usage: scripts/cegm.sh <package|deploy|smoke|destroy>
USAGE
}
cmd="${1:-}"; shift || true
case "${cmd}" in
  package) exec "${SCRIPTS_DIR}/package.sh" "$@" ;;
  deploy)  exec "${SCRIPTS_DIR}/deploy.sh" "$@" ;;
  smoke)   exec "${SCRIPTS_DIR}/smoke.sh" "$@" ;;
  destroy) exec "${SCRIPTS_DIR}/destroy.sh" "$@" ;;
  *) usage; exit 2 ;;
esac
