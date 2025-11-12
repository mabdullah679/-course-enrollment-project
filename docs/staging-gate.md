# Staging Gate Checklist

Before pushing `dev` → `staging`, make sure every item below is satisfied. The staging CI/CD pipeline assumes all work is feature‑complete and only performs hardening/sanitization:

1. **Fixes.md cleared** – no unchecked items remain or each entry is explicitly annotated with implementation notes.
2. **FutureWork.md reviewed** – any new scope is documented here, not left as TODOs in code.
3. **Navbar clock + enrollment-window hints** – SSoT-driven timestamps and the America/New_York banner are implemented or explicitly accepted as deferred.
4. **Full regression** – frontend flows (student/admin enrollments) exercised and backend build (`./mvnw -DskipTests compile`) succeeds.
5. **Security posture** – dev-only configs removed/flagged; secrets sourced from staging/prod vaults.
6. **Infra readiness** – cloud resources provisioned/updated per staging requirements.

Once all boxes are checked, create a commit on `dev` containing the phrase **"ready for staging"**. That message triggers the dev→staging promotion pipeline; the staging pipeline then sanitizes dev configs, hardens security, and deploys each component to its cloud targets.
