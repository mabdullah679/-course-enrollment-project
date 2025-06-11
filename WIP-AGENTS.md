# 🚧 WIP-AGENTS.md

_Last updated: June 11, 2025_

This document outlines microservices (“agents”) and infrastructure components that are currently in planning, in progress, or queued for CI/CD and integration.

---

## 🧪 Upcoming Microservices

### `authApp`
- Status: ❌ Not yet scaffolded
- Role: Dedicated authentication and token service
- Notes:
  - Will handle user sessions, login flows, and OAuth if needed
  - Might replace current JWT injection model

---

### `notificationApp`
- Status: ❌ Not yet scaffolded
- Role: Manages email/SMS notifications (e.g., grade posted)
- Dependencies: Mailgun API or SMTP microservice

---

## 🛠️ CI/CD Pipeline Progress

| Component     | Status     | Notes                                      |
|---------------|------------|--------------------------------------------|
| GitHub Actions| 🟡 Planned | Dev → Staging → Prod in upcoming sprints   |
| Secrets Mgmt  | ✅ Done    | Injected via Helm and Kubernetes secrets   |
| Auto-Build    | 🟡 Planned | Using `build-and-deploy.sh` as base        |

---

## 🌐 Frontend Plans

- Status: 🔜 Scaffolded with Vite or JHipster
- Framework: Likely React or Vue
- Hosted: Separate service or NGINX pod
- Auth: JWT bearer injection via gateway routing

---

## 📊 Monitoring/Observability

- 📌 Prometheus + Grafana planned via Helm
- 📌 Actuator metrics confirmed enabled (studentApp only)

---

## 🔜 Infrastructure Queue

- Enable production-grade ingress (NGINX + TLS)
- Add E2E tests for every API route
- Add Vault for secrets management (optional)
