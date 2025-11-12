# Future Work

This document captures post-MVP ideas we have discussed so we can prioritize them later.

## Enrollment & Course Flow
- [ ] Student enrollment history by semester (`/enrollments/all-attended-semesters`) so advisors can answer “what have you actually taken?” without querying the DB.
- [ ] Per-course semester view with contextual enroll/withdraw status to highlight when a learner paused and later resumed.
- [ ] Admin/staff auditing of instructor performance and enrollment SLAs.
- [ ] Make the `/admin/course-management` Create Course button perform a full CRUD cycle (call the REST API, persist via the service, and surface success/error states) so admins can add courses without 500 errors.
- [ ] Re-review the rebuilt `frontend/src/pages/Enrollments.tsx` to ensure every action button (enroll, withdraw, resubmit, reopen, delete) is wired to its expected backend call, still enforces the previously supported behaviors, and documents any mismatches between UI copy and backend transitions.
- [ ] Reintroduce the enrollment “Type” column by wiring the Credit/Audit flag through the database schema, service layer, APIs, and UI so admins aren’t looking at empty badges.

## Instructor Experience
- [ ] Course unit authoring with assignments, allowed file types, and availability windows.
- [ ] Shared unit schema so instructor edits mirror student view automatically.
- [ ] Preview mode for upcoming content and enable/disable toggles per unit.

## Staff Capabilities
- [ ] Scoped staff dashboard with read-only enrollment data plus audit submission.
- [ ] Ticketing-style workflow to review withdrawals/appeals before admins take action.

## Admin Enhancements
- [ ] Cross-role capability matrix driven entirely by the SSoT config.
- [ ] Configurable notification templates for enrollment decisions and window changes.
- [ ] Restore the `/admin/config` enrollment-window start/end timestamp hints so they pull directly from the SSoT payload (both the summary card and modal) and pair them with a global LMS clock: every navbar should show the current America/New_York date/time next to the user/role plus an info tooltip explaining that all deadlines follow that timezone.

We should revisit this list each sprint and convert the highest-value items into tickets.
