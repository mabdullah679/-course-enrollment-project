# GOALS\_AND\_ROADMAP.md

## Project Vision

This project is a full-stack, multi-environment backend system simulating enterprise-grade infrastructure. It begins as a CLI-based Spring Boot app and evolves into a fully RESTful API system with a frontend (React/Vue), cloud-hosted database, DevOps automation, and Kubernetes orchestration.

All development adheres to real-world GitOps principles, CI/CD practices, secrets management, and production hardening. Every environment (dev, staging, prod) is fully automated with dedicated GitHub Actions pipelines.

---

## ✅ Goals by Environment

### DEV ENVIRONMENT

* Scaffold microservices and gateway app using JHipster
* Build REST endpoints for `student`, `course`, `enrollment`, and `grade`
* Develop a frontend (React or Vue) integrated via API Gateway
* Use H2 or Docker-based PostgreSQL locally
* Implement full validation, exception handling, and test coverage
* Create `dev.sh`, `reset-db.sh` for local automation
* GitHub Actions CI for build, test, and Docker image tagging
* Optional: Deploy to preview environments via Docker Compose
* Secrets managed locally using `.env.dev`

### STAGING ENVIRONMENT

* Deploy Dockerized backend + frontend to EC2 via Terraform
* Use AWS RDS (PostgreSQL - staging instance)
* CI/CD pipeline promotes from `dev` branch merges
* Include `startup.sh`, `deploy.sh` for infra and E2E bootstrapping
* Run integration + end-to-end tests (Playwright/Cypress)
* Vault or GitHub Secrets used for sensitive config
* Implement blame resolution for staging test failures (Dev vs QA fault tagging)

### PRODUCTION ENVIRONMENT

* Manual promotion via `prod-deployment.sh` or release tagging
* Backend deployed to EC2 with Kubernetes or Docker
* Frontend hosted via S3 + CloudFront or separate EC2 container
* Persistent DB on AWS RDS (PostgreSQL - prod)
* TLS via Certbot + NGINX reverse proxy
* DNS masking with DuckDNS or custom domain
* Secure secrets via Vault or AWS SSM
* GitHub Actions CD pipeline with manual approval and smoke test validation

---

## 🚀 Future Enhancements

### Monitoring & Logging Stack (Phase 6 or Later)

* Prometheus + Spring Boot Actuator
* Grafana Dashboards (self-hosted or Grafana Cloud)
* Loki for log aggregation
* Optional: Filebeat + ELK stack for extended log analysis

### Kubernetes Orchestration

* Use `minikube` for local, EKS for staging/prod
* Deploy each microservice and frontend as independent pods
* Set up NGINX Ingress with TLS and DNS routing
* Enable Horizontal Pod Autoscaling and rollout strategies

---

## 🗺️ Roadmap Timeline (Updated to match PROJECT\_PLAN\_V1.2)

| Phase          | Date Range    | Key Outputs                                     |
| -------------- | ------------- | ----------------------------------------------- |
| Plan & Setup   | May 13–16     | Repo, branches, plan v1.2, roadmap updated      |
| Dev Build + CI | May 17–June 7 | Gateway/microservices, frontend, unit tests, CI |
| Staging / QA   | June 8–July 1 | Terraform infra, CD pipelines, E2E, blame logic |
| Production     | July 2–Aug 1  | TLS, secrets, full deploy, DNS masking          |
| Docs & Review  | Aug 2–Aug 16  | `/docs`, diagrams, edge case logs               |
| Final Audit    | Aug 17–Sept 7 | CI walkthrough, dry-run, monitoring/metrics     |

---

## 🧩 Working Style

* All feature work lives in `dev` branch
* CI/CD governs all transitions between `dev`, `staging`, and `main`
* Staging deployments are automatic upon dev merges
* Production is gated by manual triggers or tagged releases
* Documentation stored per-branch in `/docs` (dev, staging, prod)
* Planning and architectural notes live in `/planning` (if needed)