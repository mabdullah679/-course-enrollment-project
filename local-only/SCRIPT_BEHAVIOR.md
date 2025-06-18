✅ local-only/ALIASES.md

# Script Aliases – v1.1  
_Last Updated: June 18, 2025_

These aliases are designed to be run from anywhere, as long as the `$PROJECT_ROOT` is set correctly (automatically defined in your `.zshrc` or `.bashrc`).

---

## 🗂 Aliases List

| Alias        | Command Equivalent                               | Description                                          |
|--------------|---------------------------------------------------|------------------------------------------------------|
| `bd`         | `$PROJECT_ROOT/scripts/build-and-deploy.sh`       | Build + deploy a microservice                        |
| `pf`         | `$PROJECT_ROOT/scripts/forward-port.sh`           | Wait and forward port for pod + test API             |
| `jwt`        | `$PROJECT_ROOT/scripts/curl-endpoint.sh`          | Call a secure or public API endpoint                 |
| `reset`      | `$PROJECT_ROOT/scripts/purge-minikube.sh`         | Full Minikube + Docker environment reset             |
| `health`     | `$PROJECT_ROOT/scripts/check-health.sh`           | Generate logs and diagnosis if pod fails             |
| `expose-dev` | `$PROJECT_ROOT/scripts/expose-services.sh`        | Expose one or more dev services publicly via ngrok   |

---

## ✅ Setup Instructions

1. Add this to your `~/.zshrc` or `~/.bashrc`:

```bash
export PROJECT_ROOT="$HOME/course-enrollment-project"

alias bd="$PROJECT_ROOT/scripts/build-and-deploy.sh"
alias pf="$PROJECT_ROOT/scripts/forward-port.sh"
alias jwt="$PROJECT_ROOT/scripts/curl-endpoint.sh"
alias reset="$PROJECT_ROOT/scripts/purge-minikube.sh"
alias health="$PROJECT_ROOT/scripts/check-health.sh"
alias expose-dev="$PROJECT_ROOT/scripts/expose-services.sh"

🔁 Notes

    expose-dev is for dev use only. For staging and production, use proper EKS + TLS setups.


---

## ✅ `local-only/SCRIPT_BEHAVIOR_V1.0.md`

```md
# Script Behavior – v1.1  
_Last Updated: June 18, 2025_

This document defines the core behavior of automation scripts used across the `course-enrollment-project`. All scripts are runnable from the project root (`~/course-enrollment-project`).

---

## `build-and-deploy.sh`

**Purpose:**  
Builds the Docker image for the specified microservice and deploys it to Minikube via Helm.

**Usage:**  
```bash
./scripts/build-and-deploy.sh studentApp

Behavior:

    Converts service name to lowercase for image/tag/chart alignment

    Builds the Docker image via docker build

    Installs or upgrades the Helm chart matching the service slug

forward-port.sh

Purpose:
Waits for a microservice pod to become ready, then port-forwards it to localhost:8081 and verifies its endpoint status.

Usage:

./scripts/forward-port.sh studentApp /api/students

Behavior:

    Dynamically retries readiness checks (12 max) with countdown

    Prints status as it counts down

    If pod remains unready, runs check-health.sh

    If ready, port-forwards and then calls curl-endpoint.sh

curl-endpoint.sh

Purpose:
Performs a secure (or optionally unauthenticated) curl request against a local service endpoint.

Usage:

./scripts/curl-endpoint.sh studentApp /management/health false

Behavior:

    Extracts the JWT secret from application-dev.yml if auth_required is true

    Sends a request with or without the Authorization header

    Used inside forward-port.sh for post-deploy endpoint checks

purge-minikube.sh

Purpose:
Force-wipes the local Kubernetes setup and restarts Docker + Minikube cleanly.

Usage:

./scripts/purge-minikube.sh

Behavior:

    Quits Docker Desktop

    Kills all lingering Docker/Minikube containers and volumes

    Removes cached Minikube images and config

    Restarts Docker

    Waits for socket access

    Restarts Minikube from scratch

check-health.sh

Purpose:
If pod readiness fails, this script generates a concise log of current state and possible issues.

Usage:

./scripts/check-health.sh studentApp

Behavior:

    Saves logs to logs/health-check.log

    Archives old logs as health-check-[timestamp].log

    Captures: pod name, ready status, restart count, and last 10 logs

    Echoes root cause to terminal based on findings

expose-services.sh

Purpose:
Expose one or more microservices to the internet using ngrok and kubectl port-forward. This is strictly intended for development-only access (e.g., phone testing, remote QA, cross-device UI/health tests).

Usage:

./scripts/expose-services.sh studentapp gradeapp
./scripts/expose-services.sh --kill

Behavior:

    Validates if each service exists in K8s

    Port-forwards each to a local port starting from 9000+

    Launches an ngrok tunnel on each forwarded port

    Fetches and logs each public tunnel URL

    --kill flag shuts down all known tunnels and port-forwards

    Logs stored in: /tmp/ngrok-*.log, /tmp/portfwd-*.log, tmp-ngrok-tunnels.log

    Requires: jq, kubectl, ngrok

    ⚠️ For dev/testing only. Do not expose production services using this method.