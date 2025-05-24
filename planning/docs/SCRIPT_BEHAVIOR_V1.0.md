✅ SCRIPT_BEHAVIOR_V1.0.md
# Script Behavior – v1.0  
_Last Updated: May 24, 2025_

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



---
