# Fixes / Follow-ups

- [ ] `/admin/config` enrollment window start/end hints are temporarily hidden. Restore them once the SSoT-driven timestamps are wired up alongside the LMS-wide clock (America/New_York) and rendered inline with the user name/role section in every navbar with a timezone disclaimer.
- [ ] `frontend/src/pages/Enrollments.tsx` was deleted and rebuilt during this session; run a full regression (student + admin flows) to ensure no functionality regressed after the rewrite.
