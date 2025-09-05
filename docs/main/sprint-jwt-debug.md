When requests fail auth:

Check Network: Cookie present? If missing → shared client misconfigured. Fix before proceeding.

If Cookie present and POST/PUT/PATCH returns 403 → this is backend method security or CSRF posture. Stop and record: path, payload outline, and response headers.

Backend logs hint (from your earlier logs): filter saw “No JWT token found” on GET /users etc. Ensure FE sends requests after login sets the session cookie, and that the shared client has withCredentials: true.