# Sprint Handoff

## Recent Work
- Rebuilt the student enrollments page to preserve withdraw/delete/resubmit/reopen flows after the React rewrite.
- Polished `/admin/config` tiles, enrollment window defaults, and error handling so admins can safely toggle windows without stale data.
- Simplified the navbar hint to reduce confusion until the enrollment-window timestamp is corrected; term and end-date summaries remain available within the configuration card.
- Removed the non-functional “Type” column/actions from enrollment tables until the Credit/Audit flag exists in the backend, and noted the follow-up work in FutureWork.md.

## Immediate Next Notes
- The enrollment-window start timestamp needs another pass: both the summary card and modal must read directly from the SSoT payload, and every navbar should show the LMS clock (America/New_York) with a tooltip disclaimer beside the user badge. This was intentionally deferred and is tracked below.
- Admin enrollments UI now mirrors legacy behaviour but we still owe UX for showing enrollment type and clarifying actions once a record reaches `COMPLETED`.

## Next Sprint Focus
Refer to `docs/FutureWork.md` for detailed output:
- Re-review `frontend/src/pages/Enrollments.tsx` end-to-end and capture any backend/UI mismatches.
- Implement the SSoT-driven enrollment-window start hint beside the user badge on `/admin/config`.
- Finish course creation CRUD so the `/admin/course-management` button no longer hard-fails.
- Build the student semester history endpoint/view.
- Author instructor tooling (units, preview mode) per the doc for broader parity.

## Staging Gate Reminder
The staging pipeline only sanitizes dev configs and deploys artifacts. Review `docs/staging-gate.md` before tagging any commit with “ready for staging” so we do not promote unfinished work.

## Verification Trail
- Backend: `./mvnw -DskipTests compile`
- Frontend: manual validation via `npm run dev` for admin/student enrollment workflows.
