#!/bin/bash

# ==========================================
# build-and-deploy.sh - Helm Dev Deploy Tool
# ==========================================

SERVICE_NAME=$1
SERVICE_SLUG=$(echo "$SERVICE_NAME" | tr '[:upper:]' '[:lower:]')

if [ -z "$SERVICE_NAME" ]; then
  echo "❌ Usage: ./scripts/build-and-deploy.sh <ServiceName>"
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PATH="$PROJECT_ROOT/backend/${SERVICE_NAME}"
CHART_PATH="$PROJECT_ROOT/helm/${SERVICE_SLUG}"
IMAGE_NAME="${SERVICE_SLUG}:latest"

# Check if Helm chart exists
if [ ! -d "$CHART_PATH" ]; then
  echo "❌ Helm chart not found at: $CHART_PATH"
  exit 1
fi

# Ensure chart contains at least one template
if ! ls "$CHART_PATH/templates/"*.yaml > /dev/null 2>&1; then
  echo "❌ Helm chart exists but has no templates. Nothing to deploy at: $CHART_PATH/templates/"
  exit 1
fi

# Check if backend exists for this service
if [ -d "$BACKEND_PATH" ]; then
  BUILD_BACKEND=true
else
  BUILD_BACKEND=false
fi

# Optional: Warn if Docker context isn't Minikube
if ! docker info | grep -q "Minikube"; then
  echo "⚠️ Warning: Docker context may not be Minikube. Run: eval \"\$(minikube docker-env)\""
fi

# Enable Minikube Docker environment
eval "$(minikube docker-env)"

# If studentApp, ensure DB chart is deployed and healthy
if [[ "$SERVICE_SLUG" == "studentapp" ]]; then
  echo "📦 Ensuring studentapp-db is installed..."

  if [ ! -f "$PROJECT_ROOT/helm/studentapp-db/templates/secret.yaml" ]; then
    echo "❌ Missing secret.yaml file in studentapp-db chart. Cannot deploy DB."
    exit 1
  fi

  helm upgrade --install studentapp-db "$PROJECT_ROOT/helm/studentapp-db"

  if ! kubectl get secret studentapp-db-secret &> /dev/null; then
    echo "❌ Kubernetes Secret 'studentapp-db-secret' is not applied. Check secret.yaml or deploy it manually."
    exit 1
  fi

  echo "🔍 Waiting for studentapp-db pod to be ready..."
  for i in {1..12}; do
    DB_READY=$(kubectl get pods -l app=studentapp-db -o jsonpath="{.items[0].status.containerStatuses[0].ready}" 2>/dev/null)
    if [ "$DB_READY" == "true" ]; then
      echo "✅ studentapp-db is ready."
      break
    fi
    echo "⏳ Waiting... ($i/12)"
    sleep 5
  done

  if [ "$DB_READY" != "true" ]; then
    echo "❌ studentapp-db pod never became ready. Aborting app deployment."
    exit 1
  fi
fi

# Load .env from backend folder
if [ -f "$BACKEND_PATH/.env" ]; then
  echo "📥 Loading .env from $BACKEND_PATH/.env"
  export $(grep -v '^#' "$BACKEND_PATH/.env" | xargs)
fi

# Ensure jwtSecret is set
if [[ -z "$JWT_BASE64_SECRET" ]]; then
  echo "❌ JWT_BASE64_SECRET not found in .env. Please define it."
  exit 1
fi

# Build backend image if applicable
if [ "$BUILD_BACKEND" = true ]; then
  echo "🔨 Building Docker image: $IMAGE_NAME"
  docker build -t "$IMAGE_NAME" "$BACKEND_PATH"
fi

# Deploy via Helm with jwtSecret
echo "🚀 Deploying Helm chart: $SERVICE_SLUG"
helm upgrade --install "$SERVICE_SLUG" "$CHART_PATH" \
  --set jwtSecret="$JWT_BASE64_SECRET"

echo "✅ Done. '$SERVICE_NAME' deployed successfully."
