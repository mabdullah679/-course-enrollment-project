
---

## ✅ `local-only/EXECUTION_WORKFLOW_DEV.md`

```md
# Dev Environment Execution Workflow – v1.1  
_Last Updated: June 18, 2025_

This document defines the environment-specific steps to execute and test microservices locally.

---

## ✅ 1. Initialize Minikube Docker Context

```bash
eval "$(minikube docker-env)"

✅ 2. Build and Deploy Microservice

bd studentApp

This will build and tag the Docker image and deploy the Helm chart for the service.
✅ 3. Port Forward & Verify API

pf studentApp /api/students

This will:

    Wait for the pod to be ready

    Port forward to localhost:8081

    Verify the endpoint with or without JWT auth

✅ 4. Full Minikube Reset (if broken)

reset

This force-cleans your local Kubernetes state, Docker images, and config — perfect if pods won't start or TLS fails.
✅ 5. Manual Health Diagnosis

health studentApp

Run this if forward-port.sh fails with max retries. It creates a clear and concise log in /logs/.
✅ 6. Expose Dev Services via ngrok

expose-dev studentapp

This will:

    Port-forward the service to a local port (starting at 9000)

    Start a ngrok tunnel for external testing

    Output the public URLs in terminal and in tmp-ngrok-tunnels.log

To kill all open tunnels and ports:

expose-dev --kill

⚠️ Use only for dev/QA testing. Not suitable for staging or production environments.
✅ Optional Aliases

alias bd="$PROJECT_ROOT/scripts/build-and-deploy.sh"
alias pf="$PROJECT_ROOT/scripts/forward-port.sh"
alias jwt="$PROJECT_ROOT/scripts/curl-endpoint.sh"
alias reset="$PROJECT_ROOT/scripts/purge-minikube.sh"
alias health="$PROJECT_ROOT/scripts/check-health.sh"
alias expose-dev="$PROJECT_ROOT/scripts/expose-services.sh"

---