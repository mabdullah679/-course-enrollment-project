# Top Priority Workflows (06_10_25 to 06_14_25)

## What We’re Working On

A scalable, secure, and fully automatable configuration and validation system across all microservices in the course-enrollment-project, including dynamic `.env` generation, service-specific config templates, Helm-ready values, and health validation scripts.

---

## Config Tooling & Template Setup

* `populate-env.sh` — Generates `.env` from templates  
* `update-values.sh` — Updates key-values in `env-mapping/templates/{service}.yaml`  
* Auto-create `.env` in `backend/{service}/.env` or overwrite if exists  
* Port `CURL_IP` and service URLs added from `minikube service`  
* Logs go to: `scripts/devops/logs/update/`

---

## Directory Structure Finalization

* `scripts/devops/env-mapping/templates/` for service config YAMLs  
* `scripts/devops/logs/{audits|update|compare|dev-infra}/` for scoped log separation  

---

## Audit Tools

* `audit-ports.sh` — Reads `expected_ports` from template  
* Detects undeclared open ports; prompts to kill via `fuser`  
* Logs saved to `scripts/devops/logs/audits/`  

---

## Script Portability + Aliases

* All scripts detect `$PROJECT_ROOT` dynamically  
* All key scripts added to `PATH` + aliased in `.bashrc`/`.zshrc`