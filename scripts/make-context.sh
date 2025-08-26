#!/usr/bin/env bash
set -euo pipefail

# Smart context packer for huge repos
# Produces: all-context.txt + all-context.manifest.tsv
# Default: include infra/lambda/scripts/config/docs code; skip big stuff and binaries.

# -------- Settings you can tweak --------
MAX_FILE_SIZE_MB="${MAX_FILE_SIZE_MB:-2}"          # only include files <= 2 MB
TREE_DEPTH="${TREE_DEPTH:-3}"                      # depth for the top-level tree
OUT_TXT="${OUT_TXT:-all-context.txt}"
OUT_MANIFEST="${OUT_MANIFEST:-all-context.manifest.tsv}"

# Allowlisted folders (space-separated, shell globs OK)
ALLOW_DIRS=(
  "."                 # root
  "infra"
  "lambda"
  "scripts"
  "config"
  "deploy"
  "docker"
  "docs"
)

# Allowlisted extensions (lowercase, without dot)
ALLOW_EXTS=(
  tf tfvars
  py
  sh bash zsh
  js jsx ts tsx
  json ndjson
  yml yaml
  md txt rst
  java kt gradle
  xml properties
  dockerfile
  env sample example conf ini cfg
)

# Exclude dir globs (whole directories)
EXCLUDE_DIRS=(
  ".git"
  ".terraform"
  "node_modules"
  "venv" ".venv"
  "__pycache__"
  "target" "build" "dist" ".next" ".cache" "coverage" "logs" "tmp"
  ".idea" ".vscode" ".gradle" ".mvn"
  ".DS_Store"
)

# Exclude filename globs (files)
EXCLUDE_FILES=(
  "*.zip" "*.jar" "*.tar" "*.tar.gz" "*.tgz" "*.7z" "*.gz" "*.bz2"
  "*.png" "*.jpg" "*.jpeg" "*.webp" "*.gif" "*.svg" "*.ico" "*.pdf"
  "*.mp4" "*.mov" "*.mp3" "*.wav"
  "*.sqlite" "*.db" "*.bin" "*.dylib" "*.so" "*.exe" "*.dll" "*.iso"
)

# -------- Implementation --------

# Join helper
join_by() { local IFS="$1"; shift; echo "$*"; }

# Build find predicates
# dirs: convert to -path match OR list
build_dir_prune() {
  local parts=()
  for d in "${EXCLUDE_DIRS[@]}"; do
    parts+=( -path "*/$d/*" -o -name "$d" )
  done
  printf '('
  local first=1
  for ((i=0; i<${#parts[@]}; i+=2)); do
    if [[ $first -eq 0 ]]; then printf ' -o '; fi
    printf '%q -o %q' "${parts[i]}" "${parts[i+1]}"
    first=0
  done
  printf ')'
}

# files: convert to -name pattern OR list
build_file_excludes() {
  printf '('
  local first=1
  for p in "${EXCLUDE_FILES[@]}"; do
    if [[ $first -eq 0 ]]; then printf ' -o '; fi
    printf -- '-name %q' "$p"
    first=0
  done
  printf ')'
}

# ext whitelist: (-iname *.tf -o -iname *.py ...)
build_ext_allowlist() {
  printf '('
  local first=1
  for e in "${ALLOW_EXTS[@]}"; do
    local pat="*.${e}"
    # special-case Dockerfile (no extension)
    if [[ "$e" == "dockerfile" ]]; then
      if [[ $first -eq 0 ]]; then printf ' -o '; fi
      printf -- '-iname %q' "Dockerfile"
      first=0
      continue
    fi
    if [[ $first -eq 0 ]]; then printf ' -o '; fi
    printf -- '-iname %q' "$pat"
    first=0
  done
  printf ')'
}

# Build base directory list
build_dir_allowlist_args() {
  for d in "${ALLOW_DIRS[@]}"; do
    printf '%q ' "$d"
  done
}

# Make outputs clean
: > "$OUT_TXT"
: > "$OUT_MANIFEST"

echo "== Context pack started at $(date -u) ==" | tee -a "$OUT_TXT"

# Top-level tree summary
if command -v tree >/dev/null 2>&1; then
  echo -e "\n===== PROJECT TREE (depth $TREE_DEPTH) =====\n" | tee -a "$OUT_TXT"
  tree -a -L "$TREE_DEPTH" -I "$(join_by '|' "${EXCLUDE_DIRS[@]}")" | tee -a "$OUT_TXT"
else
  echo -e "\n(tree not installed; showing find-based listing)\n" | tee -a "$OUT_TXT"
  find . -maxdepth "$TREE_DEPTH" -mindepth 1 -type d \
    \( $(build_dir_prune) \) -prune -o -print | tee -a "$OUT_TXT"
fi

echo -e "\n===== FILE DUMPS (<= ${MAX_FILE_SIZE_MB}MB & allowlisted types) =====\n" | tee -a "$OUT_TXT"

# Build the find command dynamically
# shellcheck disable=SC2046
FILES=$(eval "
  find $(build_dir_allowlist_args) -type d \\( $(build_dir_prune) \\) -prune -o \
       -type f \\( $(build_file_excludes) \\) -prune -o \
       -type f \\( $(build_ext_allowlist) -o -iname 'Dockerfile' \\) \
       -size -${MAX_FILE_SIZE_MB}M -print
" | sort)

TOTAL_BYTES=0
printf "size_bytes\tsha256\trel_path\n" >> "$OUT_MANIFEST"

hash_file() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  elif command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    printf "no-sha256"
  fi
}

for f in $FILES; do
  # double-check size and textiness
  BYTES=$(wc -c < "$f" | tr -d ' ')
  # Skip obvious binary files by mime if file(1) exists
  if command -v file >/dev/null 2>&1; then
    MIME=$(file --brief --mime "$f")
    case "$MIME" in
      *application/*|*image/*|*audio/*|*video/*) continue ;;
    esac
  fi

  SHA=$(hash_file "$f")
  printf "%s\t%s\t%s\n" "$BYTES" "$SHA" "${f#./}" >> "$OUT_MANIFEST"

  echo -e "\n\n===== ${f#./} =====\n" >> "$OUT_TXT"
  cat "$f" >> "$OUT_TXT"

  TOTAL_BYTES=$((TOTAL_BYTES + BYTES))
done

echo -e "\n===== SUMMARY =====" | tee -a "$OUT_TXT"
echo "Files included: $(wc -l < "$OUT_MANIFEST" | awk '{print $1-1}') (see $OUT_MANIFEST)" | tee -a "$OUT_TXT"
echo "Total bytes (raw sum of included files): $TOTAL_BYTES" | tee -a "$OUT_TXT"

echo -e "\nDone. Outputs:\n  - $OUT_TXT\n  - $OUT_MANIFEST\n"
