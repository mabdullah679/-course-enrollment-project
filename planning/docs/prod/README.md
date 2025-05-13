# PRODUCTION ENVIRONMENT

## Purpose
Production is the public-facing, hardened version of the app. It is deployed with secrets and secure infrastructure.

## Stack
- Spring Boot container on EC2
- React/Vue app on separate EC2 or S3 + CloudFront
- RDS (PostgreSQL – AWS)
- Terraform for EC2, DB, EIP
- NGINX + Certbot for TLS
- DuckDNS or custom DNS
- Vault or AWS SSM for secrets

## Deployment Flow
- Triggered via `prod-deployment.sh`
- GitHub Actions builds and deploys using secrets
- TLS and DNS validated before exposure
- Logs + health checks enabled

## Folder Contents
- `/prod/main.tf`
- `/prod/nginx/`
- `/prod/secrets/`
- `/prod/tls/`
