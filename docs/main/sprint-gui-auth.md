GUI Auth: stability & flows (global)

Shared client + credentials on all /api/v1/* calls.

Session rotates on login/role change; multi-tab works.

Brand link routes by role; unauthorized routes blocked.

Denied login for unapproved accounts shows toast:

“Your account is pending approval for role {role}.”

Per-role UI and permissions are specified in sprint-all-roles-gui-auth.md.

Evidence: Cookie on protected calls; brand routing; pending-approval toast.