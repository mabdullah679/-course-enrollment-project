# GOALS_AND_ROADMAP.md

## Project Vision

This project is a full-stack, multi-environment backend system simulating enterprise-grade infrastructure. It begins as a CLI-based Spring Boot app and evolves into a fully RESTful API system with a frontend (React/Vue), cloud-hosted database, DevOps automation, and optional Kubernetes orchestration.

All development adheres to real-world GitOps principles, CI/CD practices, secrets management, and production hardening.

---

## ✅ Goals by Environment

### DEV ENVIRONMENT
- Build a Spring Boot backend exposing REST endpoints (`/api/students`, `/api/courses`, etc.)
- Develop a frontend (React or Vue) that communicates with the backend via Axios
- Use H2 or Docker-based PostgreSQL locally
- Implement full input validation and exception handling
- Create local automation scripts (`dev.sh`, `reset-db.sh`)
- GitHub Actions CI to compile + run unit tests
- Keep secrets locally managed via `.env.dev`

### STAGING ENVIRONMENT
- Dockerize frontend and backend
- Use AWS RDS (PostgreSQL - staging)
- CI/CD pipeline via GitHub Actions
- Implement `startup.sh` and `deploy.sh` for testing automation
- Run end-to-end tests (Playwright or Cypress)
- Use Terraform to provision EC2 + RDS
- Secrets passed via GitHub Secrets or Vault
- Evaluate faults: dev vs QA responsibility

### PRODUCTION ENVIRONMENT
- Host backend on EC2 (Spring Boot Docker)
- Host frontend on separate EC2 or static S3 + CloudFront
- Use AWS RDS for persistent DB
- Implement DNS masking with DuckDNS or custom domain
- TLS via Certbot + NGINX reverse proxy
- Secure secrets using Vault or AWS SSM
- Trigger deployment via `prod-deployment.sh`
- Access verified by users globally (Seattle, Lahore)

---

## 🚀 Future Enhancements

### Monitoring & Logging Stack (Phase 6 or Later)
- Prometheus for metrics (Spring Boot actuator)
- Grafana dashboards (EC2-hosted or Grafana Cloud)
- Loki for centralized log aggregation
- Optional: Filebeat + ELK stack

### Kubernetes Orchestration (Post-Prod Phase)
- Use `minikube` locally or EKS for full cloud orchestration
- Deploy backend/frontend/DB as independent pods
- Apply NGINX Ingress controller with TLS
- Auto-scale via `HorizontalPodAutoscaler`

---

## 🗺️ Roadmap Timeline (as per PROJECT_PLAN.pdf)

| Phase            | Date Range         | Key Outputs                           |
|------------------|--------------------|----------------------------------------|
| Plan & Setup     | May 13–16          | Repo, branches, roadmap, folder structure |
| Dev              | May 17–June 7      | API, frontend, unit tests              |
| Staging / QA     | June 8–July 1      | Docker, E2E, test infra, auto-merge logic |
| Production       | July 2–Aug 1       | TLS, secrets, deployment, DNS masking  |
| Docs & Review    | Aug 2–Aug 16       | `/docs`, diagrams, edge case logging   |
| Final Audit      | Aug 17–Sept 7      | Full dry-run, postmortem, resume-ready |

---

## 🧩 Working Style

- All code pushed to `dev` branch first
- Merges to `staging` only via CI-approved PR
- Production triggered manually via `prod-deployment.sh`
- Documentation lives under `/planning` and `/docs`
