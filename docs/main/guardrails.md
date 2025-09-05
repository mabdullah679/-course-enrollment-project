Scope: Frontend only unless a missing endpoint must be exposed; if so, document the exact endpoint and stop.

No hardcoded env: All runtime config is read from /api/v1/config/meta.

Cookies: Every protected request must send Cookie automatically via the shared client.

Actuator: Only call /actuator/health and /actuator/info (never /api/actuator/*). If absent, mark disabled — no error toasts.

Toasts: de-dup per group; no storms; validation errors show inline in modals.

Audit: If audit endpoints are missing, disable “i” with tooltip; no error toast.

Accessibility: Buttons/links must have aria-labels that match their tooltips.

Logging: Route guard denials and disabled feature probes log info, not error.

Stop rules: as in instruction.md.