Sprint — GUI Auth Flows (3 Cycles)

Goal: Prove end-to-end GUI flows using backend cookie auth.

Cycles (repeat x3):

Admin logs in → sees /admin dashboard.

Student self-signup → appears in Admin Users (pending if applicable).

Admin approves Student → Student logs in → reaches /dashboard.

Evidence per cycle:

Screenshot of Admin dashboard post-login.

Screenshot of Users list showing the new user and approval action.

Network pane showing cookie on a protected fetch.

Student dashboard screenshot after approval.

Notes:

Use shared client. No manual cookie fiddling.

If any protected request goes out without a cookie → STOP (cite guardrails).