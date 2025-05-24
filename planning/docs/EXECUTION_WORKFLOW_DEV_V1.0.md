
# ✅ `EXECUTION_WORKFLOW_DEV_V1.0.md`

```md
# Dev Environment Execution Workflow – v1.0  
_Last Updated: May 24, 2025_

This document defines the environment-specific steps to execute and test microservices locally.

---

## ✅ 1. Initialize Minikube Docker Context

```bash
eval "$(minikube docker-env)"


✅ 2. Build and Deploy Microservice
./scripts/build-and-deploy.sh studentApp

This will build and tag the Docker image and deploy the Helm chart for the service.

✅ 3. Port Forward & Verify API
./scripts/forward-port.sh studentApp /api/students

This will:
Wait for the pod to be ready


Port forward to localhost:8081


Verify the endpoint with or without JWT auth



✅ 4. Full Minikube Reset (if broken)
./scripts/purge-minikube.sh

This force-cleans your local Kubernetes state, Docker images, and config — perfect if pods won't start or TLS fails.

✅ 5. Manual Health Diagnosis
./scripts/check-health.sh studentApp

Run this if forward-port.sh fails with max retries. It creates a clear and concise log in /logs/.

Optional Aliases
alias bd='./scripts/build-and-deploy.sh'
alias pf='./scripts/forward-port.sh'
alias jwt='./scripts/curl-endpoint.sh'
alias reset='./scripts/purge-minikube.sh'
alias health='./scripts/check-health.sh'




