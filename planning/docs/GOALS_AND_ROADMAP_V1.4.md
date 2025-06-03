# Goals and Roadmap – v1.3  
_Last Updated: May 24, 2025_

---

## ✅ Current Goals (as of May 24, 2025)

### 🔧 Environment & Automation
- [x] Fully resettable local infrastructure via `purge-minikube.sh`
- [x] Automate pod readiness detection via `forward-port.sh`
- [x] Integrate secure endpoint testing using `curl-endpoint.sh`
- [x] Fail-safe port readiness monitoring + fallback health check via `check-health.sh`

### 🧪 Dev Flow UX Improvements
- [x] Countdown timers for pod readiness
- [x] Dynamic logging with iteration tracking
- [x] Smart retry + summary diagnosis of failures
- [x] JWT support in curl script with auth toggle

### 🚀 CI/CD Planning
- [x] CI/CD logical branching (dev → staging → prod)
- [x] Pipeline vision scoped for GitHub Actions
- [ ] Smart build triggers based on service-level diffs (planned)

---

## 🧭 Updated Roadmap (v1.3)

| Priority | Scope                | Task                                                                 | Status     |
|----------|---------------------|-----------------------------------------------------------------------|------------|
| 🔴 High   | Infra Tooling       | Smart cluster reset and forward flow                                 | ✅ Complete |
| 🔴 High   | Service Bootstraps  | Build/deploy/test flow for `studentApp`                              | ✅ Complete |
| 🔵 Med    | CI Staging          | Initial pipeline sketch + test matrix setup                          | 🚧 Planned  |
| 🟢 Low    | Frontend Prep       | Select Vue or React + scaffold with Vite                             | 🚧 Planned  |
| 🔴 High   | Developer Onboarding| Add `SCRIPT_BEHAVIOR_V1.0.md`, `EXECUTION_WORKFLOW_DEV_V1.0.md`      | ✅ Complete |
| 🟠 Mid    | End-to-End Tests    | Choose Playwright or Cypress + write core flows                      | 🚧 Planned  |
| 🟢 Low    | Monitoring & Alerting| Draft alerting & failure triage spec for later GitHub Actions phase | 🔜 Future   |

---

## 🗂 File Versioning Map (as of v1.3)

| File                                | Purpose                                   | Version |
|-------------------------------------|-------------------------------------------|---------|
| `PROJECT_PLAN_V1.4.md`              | Full phase-based project execution plan   | v1.4    |
| `GOALS_AND_ROADMAP_V1.3.md`         | Milestone goals + future roadmap          | v1.3    |
| `SCRIPT_BEHAVIOR_V1.0.md`           | Describes behavior of each core script    | v1.0    |
| `EXECUTION_WORKFLOW_DEV_V1.0.md`    | Local dev execution steps and flow        | v1.0    |

---

## 📌 Next Version Targets (v1.4+)

- [ ] `rebuild-all.sh` for orchestrating all service builds + deploys in one command
- [ ] `health-dashboard.html` or `logs/summary.txt` as quick-glance deployment status
- [ ] CI → staging pipeline implementation using Terraform + GitHub Actions
- [ ] Dedicated frontend GitHub repo (or monorepo subdir) based on chosen framework

### Helm Migration and Secret Management

- [x] PostgreSQL Helm DB setup
- [x] Inject config using Helm secret templates
- [x] Validate /actuator/info and /actuator/env exposure
- [ ] Expose /actuator/metrics and confirm Prometheus scraping
- [ ] Deploy Prometheus + Grafana monitoring stack
