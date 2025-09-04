# Continue Working From Where We Left Off

Context:
- Backend: Spring Boot + H2 in-memory database (not Postgres). Schema resets on every restart.
- Frontend: React + Vite, already running with hot reload.
- SSoT files: prompt.md, instructions.md, guardrails.md, acceptance-matrix.md.
- We’ve already implemented: security headers filter, updated /api/v1 endpoints, cookie handling in AuthController, session management service, Users/Courses/Enrollments/Grades/Exports controllers + services, DTO adjustments, frontend AuthContext, API service changes, and started on AdminUsers UI.
- Last issue: agent kept trying to insert an admin user into Postgres via Docker. Wrong, since we’re using H2.

Rules going forward:
- Do **not** attempt Docker or psql commands.
- Do **not** attempt to connect to an external DB. All persistence is H2 in-memory, reset each restart.
- Admin bootstrap must be handled via:
  1. **API flow**: sign up a user with `accountType=ADMIN`, then approve through API.
  2. **Seeding**: add a `CommandLineRunner` or `data.sql` file to auto-insert a default admin on app startup.

Tasks to continue:
1. Add startup seeding logic for a default admin account (e.g., email `admin@cegm.edu`, password `admin123`, hashed with BCrypt).
2. Ensure login and `/auth/me` flow works with seeded admin.
3. Complete AdminUsers UI page to show keyset-paginated list, approve users, and role change flow.
4. Add curl proofs for:
   - Signup student
   - Login as admin
   - Approve student
   - Student login after approval
5. Verify acceptance criteria in acceptance-matrix.md (session fixation, security headers, IDOR negatives, etc.).

If spec is ambiguous, stop and report the exact file + section blocking completion. No improvisation outside the 4 SSoT files + this continuation file.
