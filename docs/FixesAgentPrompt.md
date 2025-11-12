# Fixes Agent Prompt

## Objective
Implement every open item listed in `Fixes.md` before committing and pushing to `origin`. The focus is accuracy for the admin configuration enrollment window hint and a full regression validation for the rebuilt `frontend/src/pages/Enrollments.tsx`.

## Required Work
1. **Admin Config Enrollment Window Hint**
   - Update `/admin/config` so the enrollment window start-state hint no longer shows a stale/past timestamp.
   - Calculate the start timestamp in Eastern Time (`America/New_York`) regardless of the client’s locale.
   - Render the formatted date, time, and time zone beside the user name/role block on the left navbar, matching the existing stylized typography in that area.
   - Confirm the value updates whenever the underlying enrollment window data changes.
2. **Enrollments Page Regression**
   - Exercise both student and admin flows on `frontend/src/pages/Enrollments.tsx` (enroll, withdraw, delete, resubmit, reopen).
   - Verify every button triggers the same backend behavior that existed prior to the rewrite (status transitions, modal copy, error handling).
   - Document any regressions you fix directly in code or note remaining gaps if discovered.

## Guardrails
- Keep all new code and styles consistent with surrounding conventions.
- When dealing with time zones use `America/New_York` explicitly (no `Date` heuristics).
- Do not introduce overlapping TODOs; mark work complete only when verified.

## Verification
- For frontend changes run the relevant unit tests or `npm run test` if available, plus manual checks via `npm run dev`.
- For backend/UI integration run `./mvnw -DskipTests compile` to ensure the Spring Boot portion still builds.
- Capture screenshots or console output as needed for QA notes.

## Delivery Checklist
- All items in `Fixes.md` are addressed or annotated with implementation details.
- Code is formatted/linted.
- Prepare commit(s) but do not push until instructed; share the `git status` summary for review.
