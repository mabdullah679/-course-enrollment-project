# STAGING ENVIRONMENT

## Purpose
Staging simulates production. It's used for integration, QA, and automated end-to-end testing before code reaches main.

## Stack
- Dockerized frontend and backend
- AWS RDS (PostgreSQL)
- GitHub Actions CI/CD (build, deploy, test)
- E2E Testing: Cypress or Playwright
- Terraform for infra provisioning
- Secrets via GitHub Secrets or Vault

## Testing Strategy
- `startup.sh` initializes test env
- `deploy.sh` runs tests against APIs
- CI automatically flags regressions or integration errors

## Fault Resolution
- Failures traced to dev or QA issue depending on test logs

## Folder Contents
- `/staging/startup.sh`
- `/staging/deploy.sh`
- `/staging/e2e/`
