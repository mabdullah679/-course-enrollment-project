✅ Final README.md

# 📚 Course Enrollment & Grade Management System

A modular, full-stack educational platform designed with microservice architecture, CI/CD automation, and cloud-native infrastructure in mind. Built using Spring Boot (via JHipster), PostgreSQL, and Kubernetes with Helm orchestration. Intended for both academic demonstration and production-grade DevOps practice.

---

## 🚀 Project Overview

This system allows secure management of:
- Student enrollments
- Course creation and updates
- Grading workflows
- Gateway-level API routing and service discovery

Each module is independently deployable, using dynamic Helm configurations and automated pipelines designed for local and cloud rollout.

---

## 🏗️ Tech Stack

| Layer              | Technology                          |
|-------------------|--------------------------------------|
| **Language**       | Java 21, Bash, YAML                  |
| **Frameworks**     | Spring Boot 3.4.5, JHipster 8.11.0   |
| **Infrastructure** | Minikube (Kubernetes), Helm, Docker |
| **Auth**           | JWT (injected via secrets)           |
| **Database**       | PostgreSQL (R2DBC), Helm-managed     |
| **DevOps**         | GitHub Actions, shell automation     |
| **Monitoring**     | Spring Actuator, Prometheus-ready    |

---

## 🧱 Microservices

| Name         | Role                                      | Port |
|--------------|-------------------------------------------|------|
| `gatewayApp` | Central API gateway (discovery disabled)  | 8080 |
| `studentApp` | Manages student data and endpoints        | 8081 |
| `courseApp`  | Placeholder only                          | 8082 |
| `gradeApp`   | Placeholder only                          | 8083 |
| `consul`     | ❌ Currently disabled                      | 8500 |
| `postgresql` | Shared DB across services                 | 5432 |

> Only `studentApp` is currently deployed with a working backend, PostgreSQL database, and JHipster placeholder frontend. Status: `UP`.

> See [`MINIKUBE-PORT-MAP`](docs/MINIKUBE_PORT_MAP_V1.0.md) for mapped `NodePort`s.

---

## 🛠️ Dev Environment Setup

> See [`EXECUTION_WORKFLOW_DEV.md`](docs/EXECUTION_WORKFLOW_DEV.md)

```bash
# 1. Switch Docker to Minikube context
eval "$(minikube docker-env)"

# 2. Build + deploy a service (e.g. studentApp)
./scripts/build-and-deploy.sh studentApp

# 3. Port forward & test
./scripts/forward-port.sh studentApp /api/students

♻️ Full Environment Reset

./scripts/purge-minikube.sh

🧪 Script Shortcuts

    Defined in ALIASES.md

bd studentApp     # Build + deploy a service  
pf studentApp     # Forward port + test API  
jwt studentApp    # Curl secured API  
reset             # Reset entire Minikube cluster  
health studentApp # Run health check diagnostics  

📦 Directory Structure

backend/          → gatewayApp, studentApp, gradeApp, courseApp  
helm/             → Helm charts for all apps and DB  
scripts/          → Core automation (build, health, port, etc.)  
logs/             → Debug logs, health checks, deployment output  

📈 Roadmap

See GOALS_AND_ROADMAP.md and PROJECT_PLAN.md

✅ Helmified PostgreSQL + secret injection

✅ JWT-auth + Actuator exposure

🚧 CI/CD pipelines (dev → staging → prod)

🔜 Frontend with Vite + Vue/React

🔜 Prometheus + Grafana dashboard

📦 Production-ready Docker/EC2 config

👨‍🔧 Maintainer

Muhammad Abdullah
DevOps Engineer Intern | Cloud Infrastructure + Java Backend
LinkedIn | GitHub
🔐 License

MIT or similar — to be decided before public release.

---

### Codex Entry Point
Codex: Start here and follow all referenced .md files for full context.

## Codex Bootstrap Files

- [CODEX_BOOTSTRAP.md](./CODEX_BOOTSTRAP.md): how the project is structured for Codex
- [ALREADY-COMPLETED-AGENTS.md](./ALREADY-COMPLETED-AGENTS.md): all implemented agents
- [WIP-AGENTS.md](./WIP-AGENTS.md): in-progress ideas and agent design notes

