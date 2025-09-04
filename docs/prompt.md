# Agent Entrypoint (Read Me First)

Read and obey these files as the Single Source of Truth (no deviation):
- instruction.md
- guardrails.md
- acceptance-matrix.md
- sprint-gui-auth.md

Rules:
- Backend and frontend are already running in watch mode. Do NOT stop those shells. Open new terminals only.
- Rebuild the frontend ONLY if a config file (e.g., vite/webpack/next config) changes.
- No hardcoded values. The UI must reflect live backend/DB state.
- All APIs live under /api/v1.

Deliverables (do not paste code here):
1) Evidence logs and cURL outputs required by sprint-gui-auth.md.
2) A short report listing which acceptance-matrix.md items were exercised and passed.
3) GUI network evidence (Set-Cookie/Cookie on login, /auth/me=200) and note that role-gated pages work.

If any spec point blocks progress, STOP and cite the file and section.
