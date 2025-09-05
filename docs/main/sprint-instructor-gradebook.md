Table shape: Course | Student | Score | Grade | Feedback | Date | Actions.

Rows without grade show Pending pill and Assign Grade in Actions.

Assign Grade modal validates: numeric score (0–100), grade (A–F or backend enum), optional feedback; PUT /api/v1/grades/{enrollmentId}.

After success: replace Pending with final values; keep selection and scroll position.