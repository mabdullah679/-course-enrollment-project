What’s broken and why
Key findings

JWT secrets missing in the running backend process, so login cannot mint tokens; CLI shows DEV_JWT_ADMIN_SECRET is required but not set. Admin seeding exists, but auth dies at token signing.

Health now OK (200) and security headers present, so the security filter is fine.

GUI login/signup still fail:

Likely CORS/credentials mismatch or CSRF protection on API routes.

Form/DTO mismatch: backend expects email and accountType for signup, while the GUI either omits accountType or still uses role or username.

Cookies not sticking: browser requests may lack withCredentials: true, cookie attributes may not match dev scheme, or cookie name fallback misconfigured.

Impacted areas

Axios base client, interceptors, and withCredentials.

Auth forms (Login and Signup), field names, and request bodies.

Spring Security: CORS, CSRF for API, permitAll matchers.

Cookie creation: name, attributes, and env resolution.

Secrets injection for the running watch process, without manually stopping shells.