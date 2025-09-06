# 10-Step QA Script for Course Enrollment Project

This script verifies all acceptance criteria from PHASE 1 and PHASE 2 implementation.

## Prerequisites
- Backend running on `http://localhost:8080`
- Frontend running on `http://localhost:3000`  
- DEV profile enabled (for QA endpoints)

## Test Steps

### 1. Verify QA Sanity Endpoint
**Endpoint**: `GET http://localhost:8080/api/v1/_qa-sanity`
**Expected Response**:
```json
{
  "seededCourses": 3,
  "seededEnrollments": 1,
  "seededGrades": 2,
  "windowState": "OPEN",
  "counts": {
    "users": 5,
    "courses": 3,
    "enrollments": 1
  }
}
```
**Acceptance**: Returns {3, ≥1, ≥1, "OPEN", counts match tiles}

### 2. Test QA Console (Dev Only)
1. Open `http://localhost:3000` in browser
2. Click "QA Console" button (bottom-right)
3. Click "Refresh" in Sanity Check section
4. Verify sanity data matches step 1
5. Check Recent Requests shows latest API calls with request IDs

**Acceptance**: Console shows last 10 requestIds + endpoint + status

### 3. Verify Dashboard Error Storm Fix
1. Login as admin: `admin@cegm.edu` / `admin123`
2. Navigate to Admin Dashboard
3. Observe tile loading and any error toasts
4. Refresh page multiple times quickly

**Acceptance**: ≤1 global error toast despite multiple API calls; tiles show numbers or inline errors

### 4. Verify Dashboard Tiles Match Counts
1. On Admin Dashboard, check tile values:
   - Users: 5+ users
   - Courses: 3+ courses  
   - Enrollments: 1+ enrollments
   - Grades: 2+ grades
2. Compare with QA sanity counts from step 1

**Acceptance**: Dashboard tiles match /_qa-sanity counts exactly

### 5. Test Staff Routing
1. Logout and login as staff: `staff@cegm.edu` / `staff123`
2. Verify redirect to `/staff` with "Staff Dashboard" title
3. Navigate to Users page via `/staff/users`
4. Verify user management functionality loads

**Acceptance**: Staff pages load under /staff/*; title not "Admin dashboard"

### 6. Test Users Management (Admin/Staff)
1. Login as admin or stay logged in as staff
2. Go to Users page
3. Test filters: Role=Admin AND Status=Pending
4. Test Approved/Active toggles
5. Click audit drawer (blue icon) on any user

**Acceptance**: Filters are AND logic; toggles persist; audit shows events

### 7. Test Toast Deduplication
1. Open QA Console
2. Navigate to a protected page while logged out (to trigger 403s)
3. Observe toast behavior with multiple rapid 403 errors
4. Check QA Console shows multiple requests but only one toast

**Acceptance**: Max 1 toast per error code per 10 seconds

### 8. Test Enrollment Window Behavior
1. Login as admin
2. Navigate to Configuration page
3. Check enrollment window state shows "OPEN"
4. Verify student pages read window state (not hardcoded)

**Acceptance**: Window state is dynamic; students can enroll when OPEN

### 9. Test Request ID Correlation
1. With QA Console open, trigger a server error (access admin as student)
2. Note the request ID in error toast (format: "Ref: req_xxxx")
3. Find the same request ID in QA Console Recent Requests
4. Verify IDs match for correlation

**Acceptance**: Error toast IDs correlate to QA Console and server logs

### 10. Test Role-Based Access
1. Test admin access to all routes
2. Test staff access to users and support only
3. Test instructor access to courses and gradebook
4. Test student access blocked from admin routes

**Acceptance**: No unexpected redirects; proper role enforcement

## Verification Checklist

- [ ] QA sanity returns expected data structure
- [ ] QA console tracks requests with proper IDs
- [ ] Dashboard tiles show correct counts without error spam
- [ ] Staff routing works with proper titles
- [ ] User management has functional filters and audit
- [ ] Toast deduplication prevents spam (10s window)
- [ ] Enrollment window reads dynamic state
- [ ] Request ID correlation works end-to-end
- [ ] Role-based routing enforced properly
- [ ] All counts match between sanity check and dashboard

## Expected Outputs

### QA Sanity Response Example
```json
{
  "seededCourses": 3,
  "seededEnrollments": 1, 
  "seededGrades": 2,
  "windowState": "OPEN",
  "counts": {"users": 5, "courses": 3, "enrollments": 1}
}
```

### Request ID Examples
- Format: `req_[random]_[timestamp]`
- Toast: "Something went wrong. Try again. Ref: req_vokw"
- Console: "ID: req_vokwvy3wg_1757173236335"

## Troubleshooting

### If QA sanity returns error:
- Check backend is running with DEV profile
- Verify `/api/v1/_qa-sanity` is in permitted endpoints
- Check seeding completed successfully

### If toasts spam:
- Check error codes are being passed correctly
- Verify 10-second deduplication logic
- Look for different error codes causing separate toasts

### If counts don't match:
- Check seeding idempotency
- Verify H2 database persists for process lifetime
- Restart backend to re-seed if needed