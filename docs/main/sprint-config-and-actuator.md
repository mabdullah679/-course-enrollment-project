If Spring Boot Actuator is not on the classpath:

FE must not call /actuator/* except to probe once.

Health/Info tiles remain Disabled with tooltip.

Config Meta is from /api/v1/config/meta only; never from Actuator.

If Actuator is present:

Call exactly /actuator/health and /actuator/info.

Do not prefix with /api.

Treat non-200 as Unavailable (no spinner).