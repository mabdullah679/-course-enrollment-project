#!/usr/bin/env bash
set -euo pipefail

# CEGM LMS full-stack hot reload helper
# Runs backend with Spring DevTools and the Vite dev server concurrently.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "🚀 Starting stacked hot reload (backend + frontend)"

cleanup() {
  echo "\n🛑 Stopping dev servers..."
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "🔧 Backend watcher via Spring DevTools"
(
  cd "$BACKEND_DIR"
  ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
) &
BACKEND_PID=$!

echo "🎨 Frontend Vite dev server"
(
  cd "$FRONTEND_DIR"
  npm install >/dev/null 2>&1 || true
  npm run dev
) &
FRONTEND_PID=$!

wait
