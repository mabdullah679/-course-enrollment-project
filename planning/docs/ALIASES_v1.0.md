# Script Aliases – v1.0  
_Last Updated: May 24, 2025_

These aliases are designed to be run from anywhere, as long as the `$PROJECT_ROOT` is set correctly (automatically defined in your `.zshrc`).

---

## 🗂 Aliases List

| Alias   | Command Equivalent                         | Description                              |
|---------|---------------------------------------------|------------------------------------------|
| `bd`    | `$PROJECT_ROOT/scripts/build-and-deploy.sh` | Build + deploy a microservice            |
| `pf`    | `$PROJECT_ROOT/scripts/forward-port.sh`     | Wait and forward port for pod + test API |
| `jwt`   | `$PROJECT_ROOT/scripts/curl-endpoint.sh`    | Call a secure or public API endpoint     |
| `reset` | `$PROJECT_ROOT/scripts/purge-minikube.sh`   | Full Minikube + Docker environment reset |
| `health`| `$PROJECT_ROOT/scripts/check-health.sh`     | Generate logs and diagnosis if pod fails |

---

## ✅ Setup Instructions

1. Add this to `~/.zshrc` or `~/.bashrc`:

```bash
export PROJECT_ROOT="$HOME/course-enrollment-project"

alias bd="$PROJECT_ROOT/scripts/build-and-deploy.sh"
alias pf="$PROJECT_ROOT/scripts/forward-port.sh"
alias jwt="$PROJECT_ROOT/scripts/curl-endpoint.sh"
alias reset="$PROJECT_ROOT/scripts/purge-minikube.sh"
alias health="$PROJECT_ROOT/scripts/check-health.sh"
