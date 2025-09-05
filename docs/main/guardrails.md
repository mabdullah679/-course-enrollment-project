Change boundaries

Do not create/delete/rename backend controllers, services, entities, DTOs, security, or dependencies.

Do not modify SecurityConfig/CSRF/cookie secrets.

Frontend-only changes plus read-only use of existing endpoints. If /api/v1/config/meta or actuator don’t exist, render Disabled tiles.

Paths & client

App APIs: /api/v1/*; actuator: /actuator/* (if present).

All feature modules must import the shared HTTP client; credentials enabled.

Cookies & CORS (dev)

Cookie: HttpOnly, Secure=false, SameSite=Lax, Path=/, no Domain.

CORS: http://localhost:3000 with credentials.

CSRF posture

JSON API w/ JWT cookie in dev should not require CSRF unless backend enforces. If a protected POST 403s with Cookie present → STOP, cite this section.

Stop conditions

Protected request without Cookie → STOP.

Actuator path includes /api → STOP.

Backend edits needed → STOP and ask.