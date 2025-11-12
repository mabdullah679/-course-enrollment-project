# Saad Reference

Welcome! To pick up where the last sprint left off, follow these steps:

1. **Read `docs/handoff.md`** – it summarizes the current state, the intentionally deferred enrollment-window timestamp fix, and verification notes (including the new navbar/LMS-clock requirement).
2. **Review `docs/FutureWork.md`** – this is the authoritative backlog; when you ask Codex for help, reference the specific bullet(s) so it knows which requirement to implement (e.g., the global timezone clock + start/end-date wiring).
3. **Check `docs/staging-gate.md`** before allowing any “ready for staging” commit on `dev`; that checklist explains what must be completed prior to the automated promotion pipeline.
3. **Check `docs/FixesAgentPrompt.md`** if you need the exact guardrails/acceptance criteria that guided the earlier fixes.
4. When filing a new task for Codex, tell it explicitly which of the above documents to read (e.g., “read docs/handoff.md and docs/FutureWork.md, then…”). That keeps the context tight and prevents drift.
5. Use the usual workflow scripts (see `scripts/` and `docs` mentions) after syncing the repo: run backend compile with `./mvnw -DskipTests compile`, then front-end smoke via `npm run dev` or the test scripts referenced in the docs.

Ping me if anything feels unclear; otherwise this checklist should keep you aligned with the current plan.
