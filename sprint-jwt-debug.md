# Sprint Add-On: JWT Diagnostics & Stabilization (Dev)

Read this together with:
- prompt.md
- instruction.md
- guardrails.md
- acceptance-matrix.md
- sprint-gui-auth.md

Do **not** stop existing watch shells. Rely on devtools/watch-mode auto-reloads. Frontend origin is **http://localhost:3000**.

---

## 1) Scope and Goals
Fix GUI auth failures caused by **JWT signature mismatches** and related config drift. Produce hard evidence showing:
- One deterministic **dev signing secret** (or `kid`-based selection if using multiple secrets).
- Signer and verifier use the **same key and encoding**.
- Cookies are rotated and stale tokens cleared after secret changes.
- GUI and CLI both succeed for login → `/auth/me` flows.

---

## 2) Current Hypotheses (ranked)
1. **Key selection mismatch** (admin token verified with student secret or vice versa).
2. **Secret changed** via hot reload, but browser kept an **old cookie** (stale token).
3. **Mixed encoding**: one side uses **raw bytes**, the other expects **Base64**.
4. **Role/claims change** without **token reissue**, token fails new checks.

---

## 3) Non-Negotiable Dev Policy (choose ONE)
**Option A (recommended for this sprint): Single dev secret**
- Use **one HS256 secret** for all tokens in dev:
  - `auth.jwt.secret: "<≥32 chars, stable in application-dev.yml>"`
- Sign and verify with the **same** key. No admin/student split in dev.

**Option B (if multiple dev secrets must remain): `kid`-based selection**
- Add JWT header `kid: "admin"` or `"student"` at **sign time**.
- Verifier selects key **by `kid`**, not by role claim or URL.
- Log the picked key: `verifier_key=kid:admin|kid:student`.

> You must implement **Option A or Option B** and show logs proving which key is used on each request.

---

## 4) Config Normalization (no env drift)
- Put the chosen secret(s) **in application-dev.yml** (or active dev profile), **not** ephemeral env-only.  
- Ensure **sign** and **verify** both read from the **same config bean**.  
- After saving the file, let Spring devtools auto-restart.  
- **Immediately clear site cookies** in the browser (or provide a “force logout” path) so stale tokens are not reused.

**Encoding rule (pick one and stick to it):**
- **Raw string** path: `Keys.hmacShaKeyFor(secret.getBytes(UTF_8))` for both sign & verify.  
- **Base64** path: store Base64 secrets; do `Decoders.BASE64.decode(secret)` for both sign & verify.  
- **Do not mix** raw vs Base64 across sign/verify.

---

## 5) Instrumentation (temporary, dev-only)
Add **request-scoped logging** (or enable access logs) to print on every auth-bearing request:
- `method`, `path`, `status`, `request_id/MDC`
- `User-Agent` (to distinguish GUI vs CLI)
- Cookie **name** presence (not the value)
- **JWT header** fields (at least `kid` if Option B)
- **Which key** was used to verify (e.g., `verifier_key=kid:student` or `verifier_key=single-dev-secret`)
- On error, log the **claim set** minus sensitive data (no PII) and the **exception type** (e.g., `SignatureException`)

Correlate with time: a `SignatureException` at `T=X` must map to exactly one request-id with either a browser or curl user-agent.

---

## 6) Cookie & CORS/CSRF (dev HTTP)
- CORS allow origin: **http://localhost:3000** with `allowCredentials=true`.  
- CSRF: **disabled for API** in dev unless GUI supplies tokens now.  
- Cookie attributes (dev HTTP): `Secure=false`, `HttpOnly=true`, `SameSite=Lax`, `Path=/`, **no Domain**, **no `__Host-`**.  
- **Rotate cookie & server session ID** on **login** and **role change**.

---

## 7) Repeatable Repro (no restarts)
### A) CLI: three cycles in the same build
1. **Admin login** (expect `Set-Cookie`)
2. `/auth/me` (200)
3. Signup student (200), list users (200), approve (200)
4. Student login (200) → `/auth/me` (200)
Repeat with 3 different student emails.  
Capture **HTTP status lines** and the **`Set-Cookie`** header on admin login.

### B) GUI:
- Clear site cookies, reload app on **http://localhost:3000**
- Login → observe `Set-Cookie` in Network response
- `/auth/me` → 200 with `Cookie` present in request
- Signup → 200 (form includes `accountType` or server defaults)
- Admin approves → student logs in → student scope loads
If any 401/403, capture **preflight**, **CORS headers**, and the **JWT diagnostics logs** from §5.

---

## 8) Failure Decision Tree
- **`SignatureException`** with GUI **only**:
  - Check **User-Agent** in logs and **verifier_key** line.
  - If `kid` absent (Option B), you’re not tagging; add `kid` at sign and select on verify.
  - If single secret (Option A) but still failing: stale cookie — clear and retry.

- **`SignatureException`** GUI + CLI:
  - Your **signer/verify encoding** differs (raw vs Base64) or keys differ. Normalize per §4.
  - Confirm dev config: signer and verifier resolve the **same bean value**.

- **401/403 after successful login**:
  - Check if cookie was actually set (Network → Response Headers → `Set-Cookie`).
  - Ensure `/auth/me` sends `Cookie` and CORS allows credentials for origin 3000.
  - Ensure CSRF is disabled for API in dev if tokens aren’t provided by GUI.

---

## 9) Evidence to Produce
- Excerpts of logs showing for at least **one GUI login**:
  - `User-Agent`, `request_id`, `verifier_key=...`, `kid=...` (if Option B), and 200 on `/auth/me`.
- CLI outputs for **three consecutive cycles** (no restarts) showing:
  - `Set-Cookie` on admin login, 200s for `/auth/me`, signup, approve, student login.
- Screenshot or HAR snippet showing browser **Set-Cookie** on login and **Cookie** on `/auth/me`.
- One-paragraph confirmation that **/api/v1/health** is public and returns 200.

---

## 10) Exit Criteria (JWT-specific)
- In dev, **exactly one** of these holds true and is verified by logs:
  - **Option A**: a **single** secret is used to sign & verify **all** tokens.
  - **Option B**: tokens carry a **`kid`** and the verifier picks the key by `kid`.
- No `SignatureException` during GUI and CLI flows after cookies cleared.
- Cookies rotate on login and role change.
- GUI login and `/auth/me` return 200 consistently; signup → approve → student login works.

---

## 11) Rollback / Safety
- If changes introduce widespread failures, **revert to Option A (single dev secret)**, clear cookies, and retest.  
- Keep `kid` only when you have reliable instrumentation and tests proving the path.

End.
