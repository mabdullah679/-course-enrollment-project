Validate courseCode uniqueness client-side only if list already contains it; server remains source of truth (handle 409 gracefully).

Credits must be positive integer; inline validation prior to POST.

Status enumeration: DRAFT | ACTIVE | ARCHIVED.

Instructor view lists only instructor-owned courses; Admin sees all.