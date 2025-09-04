#!/usr/bin/env bash
set -euo pipefail

# Define images
BACKEND_IMAGE="cegm-backend:dev"
FRONTEND_IMAGE="cegm-frontend:dev"

# Paths to your actual Dockerfiles
BACKEND_DOCKERFILE="backend/Dockerfile"
FRONTEND_DOCKERFILE="frontend/Dockerfile"

# Build function with retry on missing subdir
build_with_retry() {
  local context=$1
  local dockerfile=$2
  local image=$3

  echo "🚀 Building $image..."
  if ! docker build -t "$image" -f "$dockerfile" "$context"; then
    echo "⚠️ Initial build failed for $image, checking for missing subdir errors..."

    # Capture the error logs
    local logfile
    logfile=$(mktemp)
    if docker build -t "$image" -f "$dockerfile" "$context" >"$logfile" 2>&1; then
      rm -f "$logfile"
      return
    fi

    # Look for COPY lines that failed with "no such file or directory"
    local missing_dirs
    missing_dirs=$(grep "no such file or directory" "$logfile" | sed -E 's/.*COPY ([^ ]+) .*/\1/' || true)

    if [[ -n "$missing_dirs" ]]; then
      echo "📂 Missing directories detected:"
      echo "$missing_dirs"
      for path in $missing_dirs; do
        dir=$(dirname "$path")
        if [[ ! -d "$context/$dir" ]]; then
          echo "👉 Creating missing directory: $context/$dir"
          mkdir -p "$context/$dir"
        fi
      done
      echo "🔁 Retrying build for $image..."
      docker build -t "$image" -f "$dockerfile" "$context"
    else
      echo "❌ Build failed due to an error unrelated to subdirectories."
      cat "$logfile"
      exit 1
    fi
    rm -f "$logfile"
  fi
}

# Build backend (context is repo root so COPY paths like "backend/..." resolve correctly)
build_with_retry "." "$BACKEND_DOCKERFILE" "$BACKEND_IMAGE"

# Build frontend
build_with_retry "." "$FRONTEND_DOCKERFILE" "$FRONTEND_IMAGE"

echo "✅ All images built successfully."
