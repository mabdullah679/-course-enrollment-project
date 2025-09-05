Agent Entrypoint

Read and obey these files as the Single Source of Truth:

instruction.md

guardrails.md

acceptance-matrix.md

sprint-gui-auth.md

sprint-jwt-debug.md

sprint-all-roles-gui-auth.md

sprint-ui-wiring-and-hardening.md

Runtime rules

Keep watch shells running; open new terminals only.

Rebuild the frontend only if a config file changes.

Localhost only: FE http://localhost:3000 ↔ BE http://localhost:8080.

Routing and client

App APIs: /api/v1/*

Actuator: /actuator/* only if actuator already exists

Use one shared HTTP client with credentials for every protected request.

Stop rules

Protected request without a Cookie header → STOP and fix.

Any actuator call containing /api → STOP and fix.

Protected POST returns 403 with Cookie present → STOP (do not change backend); cite CSRF/method security.

Deliverables

Apply all tasks described in instruction.md and sprint docs.

No hardcoded environment values; if present, read config from /api/v1/config/meta.

Produce acceptance evidence listed in acceptance-matrix.md.

Provide a concise change summary grouped by file.