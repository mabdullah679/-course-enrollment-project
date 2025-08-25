#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT="$PROJECT_ROOT/infra_dump.txt"

: > "$OUTPUT"

echo "[*] Dumping infra scripts + configs into $OUTPUT"
echo "[DEBUG] Script dir   : $SCRIPT_DIR"
echo "[DEBUG] Project root : $PROJECT_ROOT"

dump_files() {
  local title="$1"; shift
  local files=("$@")

  if [ ${#files[@]} -eq 0 ]; then
    echo "[WARN] No files found for $title"
    return
  fi

  for f in "$@"; do
    echo "[DEBUG] Dumping $f"
    {
      echo ""
      echo "===== FILE: ${f#$PROJECT_ROOT/} ====="
      echo ""
      cat "$f"
    } >> "$OUTPUT"
  done
}

# Scripts
scripts=$(find "$PROJECT_ROOT/infra/scripts" -maxdepth 1 -type f -name "*.sh" 2>/dev/null || true)
dump_files "scripts" $scripts

# Terraform root configs
tfs=$(find "$PROJECT_ROOT/infra" -maxdepth 1 -type f \( -name "*.tf" -o -name "*.tfvars" \) 2>/dev/null || true)
dump_files "terraform root" $tfs

# tfvars subdir
if [ -d "$PROJECT_ROOT/infra/tfvars" ]; then
  subvars=$(find "$PROJECT_ROOT/infra/tfvars" -type f -name "*.tfvars" 2>/dev/null || true)
  dump_files "tfvars subdir" $subvars
else
  echo "[DEBUG] No infra/tfvars directory found"
fi

echo "[*] Dump complete (no tfstate included)."
