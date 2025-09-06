# Toast Mapping Table

This document maps backend error codes to frontend toast messages for the Course Enrollment Project.

## Error Code Format
Backend errors follow the structure: `{code, field?, message, requestId?}`

## Toast Deduplication Rules
- Maximum 1 toast per error code per 10 seconds
- 5xx errors include request ID reference: "Ref: req_xxxx"
- Field validation errors are shown inline, not as toasts

## Error Code Mappings

| Error Code | Frontend Toast Message | Context | Shows Toast? | Notes |
|------------|------------------------|---------|---------------|-------|
| `VALIDATION_ERROR` | "Please fix the highlighted fields." | Form validation | No | Shows inline field errors instead |
| `DUPLICATE_RESOURCE` | "Already exists." | Resource creation | Yes | Generic duplicate error |
| `ALREADY_ENROLLED` | "You're already enrolled." | Student enrollment | Yes | Enrollment-specific duplicate |
| `NOT_FOUND` | "Item no longer exists." | Resource not found | Yes | 404 errors |
| `ENROLLMENT_WINDOW_CLOSED` | "Enrollment window is closed." | Student enrollment | Yes | Window state enforcement |
| `PERMISSION_DENIED` | "You don't have permission to do that." | Auth errors | Yes | 401/403 errors |
| `UNAUTHORIZED` | "You don't have permission to do that." | Auth errors | Yes | Same as permission denied |
| `FORBIDDEN` | "You don't have permission to do that." | Auth errors | Yes | Same as permission denied |
| `SERVER_ERROR` | "Something went wrong. Try again. Ref: req_xxxx" | 5xx errors | Yes | Includes request ID |
| `INTERNAL_SERVER_ERROR` | "Something went wrong. Try again. Ref: req_xxxx" | 5xx errors | Yes | Includes request ID |
| `UNKNOWN_ERROR` | "Something went wrong. Try again." | Fallback | Yes | Generic fallback |

## Special Handling

### Server Errors (5xx)
- **Format**: `"Something went wrong. Try again. Ref: req_xxxx"`
- **Request ID**: First 8 characters of the full request ID
- **Purpose**: Allows correlation with server logs and QA console

### Field Validation
- **Trigger**: `code === "VALIDATION_ERROR"`
- **Behavior**: No toast shown, errors displayed inline on form fields
- **Details**: Backend provides `{field, reason}` in details array

### Auth Errors (401/403)
- **Behavior**: 
  1. Toast shows permission denied message
  2. Session cleared automatically
  3. User redirected to login page
- **Deduplication**: Prevents auth error spam during session cleanup

## Implementation Details

### Toast Deduplication
```typescript
// 10-second window per error code
const activeToastCodes = new Map<string, number>()
const DEFAULT_DEBOUNCE_MS = 10000

// Usage
toastError(message, code, requestId)
```

### Request ID Format
- **Pattern**: `req_[random]_[timestamp]`
- **Example**: `req_vokwvy3wg_1757173236335`
- **Tracking**: Visible in QA Console for correlation

### Error Response Structure
```json
{
  "code": "SERVER_ERROR",
  "message": "Database connection failed",
  "requestId": "req_abc123_1234567890",
  "field": "email"  // optional, for validation errors
}
```