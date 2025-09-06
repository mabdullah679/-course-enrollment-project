# Request ID Correlation Documentation

This document explains how to correlate frontend error messages with backend logs using Request IDs.

## Overview

When errors occur, especially 5xx server errors, the system provides Request IDs that can be traced across:
1. **Frontend error toasts** - Shows abbreviated ID
2. **QA Console** - Shows full ID and request details  
3. **Backend logs** - Contains full ID with context
4. **Network tab** - Shows ID in request/response headers

## Request ID Format

### Full Format
- **Pattern**: `req_[random_string]_[timestamp]`
- **Example**: `req_vokwvy3wg_1757173236335`
- **Components**:
  - `req_`: Fixed prefix
  - `vokwvy3wg`: Random 9-character string
  - `1757173236335`: JavaScript timestamp

### Abbreviated Format (in Toasts)
- **Pattern**: `req_[first_4_chars]`
- **Example**: `req_vokw` (from `req_vokwvy3wg_1757173236335`)
- **Purpose**: Keep toast messages concise while enabling correlation

## Correlation Process

### 1. Frontend Error Toast
When a 5xx error occurs, the toast shows:
```
Something went wrong. Try again. Ref: req_vokw
```

### 2. QA Console Lookup
1. Open QA Console (dev only)
2. Look in "Recent Requests" section
3. Find entry with matching abbreviated ID
4. Full ID example: `req_vokwvy3wg_1757173236335`

### 3. Backend Log Correlation
Search backend logs for the full Request ID:
```bash
grep "req_vokwvy3wg_1757173236335" application.log
```

### 4. Network Tab Verification
1. Open browser DevTools → Network
2. Find the failed request
3. Check request headers for `X-Request-Id`
4. Verify ID matches QA Console entry

## Implementation Details

### Frontend Request ID Generation
```typescript
const generateRequestId = () => {
  return 'req_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}
```

### Backend Request ID Handling
```java
@Override
public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    String requestId = request.getHeader("X-Request-Id");
    if (requestId == null || requestId.trim().isEmpty()) {
        requestId = UUID.randomUUID().toString();
    }
    
    // Store in request attribute and echo in response
    request.setAttribute("X-Request-Id", requestId);
    response.setHeader("X-Request-Id", requestId);
    
    return true;
}
```

### Error Response with Request ID
```json
{
  "code": "SERVER_ERROR",
  "message": "Database connection timeout",
  "requestId": "req_vokwvy3wg_1757173236335",
  "timestamp": "2025-09-06T15:40:36.335Z"
}
```

## QA Console Features

### Request Tracking
The QA Console automatically tracks:
- **Endpoint**: Full API path
- **Method**: HTTP method (GET, POST, etc.)
- **Status**: HTTP status code (200, 403, 500)
- **Timestamp**: When request was made
- **Request ID**: Full ID for correlation

### Filtering & Search
- Last 10 requests shown automatically
- Color coding: Green (2xx), Yellow (4xx), Red (5xx)
- Clear button to reset tracking
- Automatic cleanup of old entries

## Correlation Examples

### Example 1: Database Error
**Toast**: "Something went wrong. Try again. Ref: req_abc1"
**QA Console**: 
```
/api/v1/users          500
GET                    15:42:10
ID: req_abc123def_1757173330000
```
**Backend Log**:
```
2025-09-06 15:42:10 ERROR [req_abc123def_1757173330000] Database connection timeout in UserService.getUsers()
```

### Example 2: Authentication Error
**Toast**: "You don't have permission to do that."
**QA Console**:
```
/api/v1/admin/config   403
GET                    15:43:15
ID: req_xyz789ghi_1757173395000
```
**Backend Log**:
```
2025-09-06 15:43:15 WARN [req_xyz789ghi_1757173395000] Access denied for user role=STUDENT on endpoint=/api/v1/admin/config
```

## Debugging Workflow

### 1. User Reports Error
User sees toast: "Something went wrong. Try again. Ref: req_def4"

### 2. Developer Investigation
1. **Ask for timestamp**: When did error occur?
2. **Check QA Console**: Look for `req_def4*` around that time
3. **Get full ID**: `req_def456jkl_1757173456789`
4. **Search logs**: `grep "req_def456jkl_1757173456789" *.log`

### 3. Root Cause Analysis
Backend log shows:
```
2025-09-06 15:44:16 ERROR [req_def456jkl_1757173456789] java.sql.SQLException: Connection pool exhausted
    at com.cegm.lms.service.UserService.getUsers(UserService.java:45)
    at com.cegm.lms.controller.UsersController.getUsers(UsersController.java:28)
```

### 4. Resolution Tracking
- **Issue**: Connection pool exhausted
- **Request ID**: req_def456jkl_1757173456789
- **User Impact**: Unable to load users page
- **Fix**: Increase connection pool size in application.yml

## Best Practices

### For Developers
1. **Always include Request ID in logs** for server errors
2. **Use structured logging** with consistent format
3. **Keep QA Console open** during development for real-time debugging
4. **Test error scenarios** to verify correlation works

### For Support Teams
1. **Ask users for "Ref:" value** from error toasts
2. **Check QA Console first** for quick correlation
3. **Use full Request ID** when searching logs
4. **Document correlation** in support tickets

### For QA Testing
1. **Verify Request ID format** in all error responses
2. **Test correlation workflow** for different error types
3. **Ensure QA Console tracks** all request types
4. **Validate toast abbreviation** matches full ID

## Limitations

### Request ID Scope
- **Session-specific**: New session = new ID generator seed
- **Client-side generated**: Not guaranteed unique across instances
- **Dev environment only**: QA Console not available in production

### Correlation Timing
- **Clock synchronization**: Frontend and backend clocks must be reasonably synced
- **Log rotation**: Old logs may not be available
- **Request buffering**: Some requests may not appear immediately in QA Console

## Configuration

### Enable Request ID Logging
```java
// In application.yml
logging:
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} %5p [%X{requestId:-}] %c{1} - %m%n"
```

### QA Console Settings
```typescript
// Maximum requests to track
const MAX_TRACKED_REQUESTS = 10

// Request ID abbreviation length  
const ABBREVIATED_LENGTH = 8 // "req_xxxx"
```