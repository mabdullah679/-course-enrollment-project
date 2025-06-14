# Second Priority Workflows (06_15_25 to 06_22_25)

## Config Consistency & Validation

* `compare reality {env} {app} {short|lengthy}`  
* Validates `.env`, `env-mapping/templates/{service}.yaml`, and `config/envs/{env}/env-master-map.yaml`  
* Logs to `scripts/devops/logs/compare/`

---

## Configuration Parity

* One `env-master-map.yaml` per env:  
  - `config/envs/dev/env-master-map.yaml`  
  - `config/envs/staging/…`, `prod/…`

---

## Testing Output Validation

* If `/actuator/health` output passes, log to:


scripts/devops/logs/test-results/you-did-it-bro.txt


---

## CI & Documentation Prep

* Write doc linking `.env` to Helm via `values.yaml`  
* Add `compare reality` and `audit-ports` to CI pre-merge check  
* All services use same key names — no prefixing — scoped by folder only
