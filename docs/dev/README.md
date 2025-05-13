# DEV ENVIRONMENT

## Purpose
The dev environment is where all core functionality is developed, tested, and debugged. All commits go here first.

## Stack
- Spring Boot (Java 21)
- H2 or local PostgreSQL
- React or Vue + Vite
- Axios (REST API)
- JUnit / Mockito for unit testing
- GitHub Actions CI for compile + test verification
- Local scripts: `dev.sh`, `reset-db.sh`

## Requirements
- Input validation and error handling in backend
- Frontend and backend communicate via REST
- `.env.dev` used for local secrets/config

## Folder Contents
- `/dev/backend`: Spring Boot backend
- `/dev/frontend`: React or Vue frontend
