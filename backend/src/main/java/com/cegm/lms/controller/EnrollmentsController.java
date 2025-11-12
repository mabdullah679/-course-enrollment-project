package com.cegm.lms.controller;

import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.model.Enrollment;
import com.cegm.lms.model.enums.EnrollmentStatus;
import com.cegm.lms.service.EnrollmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for enrollment management operations.
 * Implements SSoT requirements for enrollment filtering and state management.
 */
@RestController
@RequestMapping("/api/v1/enrollments")
@CrossOrigin
public class EnrollmentsController {

    @Autowired
    private EnrollmentService enrollmentService;

    /**
     * Get enrollments with filtering by type, semester, courseId, studentId.
     * Implements SSoT requirements for enrollment views.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR') or hasRole('STAFF') or hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Page<Enrollment>>> getEnrollments(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String after,
            @RequestParam(defaultValue = "25") int size) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isStudent = hasAuthority(authentication, "ROLE_STUDENT");
        Long currentUserId = getAuthenticatedUserId(authentication);

        if (isStudent) {
            if (currentUserId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Unable to determine current user", "MISSING_CONTEXT"));
            }
            if (studentId != null && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Students may only view their own enrollments", "FORBIDDEN"));
            }
            studentId = currentUserId; // Force self-filtering for students
        }

        Sort sort = Sort.by("id").ascending();
        Pageable pageable = PageRequest.of(0, size, sort);

        Page<Enrollment> enrollments;
        
        // Map type filter to enrollment status
        if ("available".equalsIgnoreCase(type)) {
            // Available enrollments - courses with open enrollment
            enrollments = enrollmentService.getAvailableEnrollments(pageable);
        } else if ("pending".equalsIgnoreCase(type)) {
            enrollments = enrollmentService.getEnrollmentsByStatus(EnrollmentStatus.PENDING, pageable);
        } else if ("unavailable".equalsIgnoreCase(type)) {
            // Unavailable - courses with closed enrollment or archived
            enrollments = enrollmentService.getUnavailableEnrollments(pageable);
        } else if (courseId != null) {
            enrollments = enrollmentService.getEnrollmentsByCourse(courseId, pageable);
        } else if (studentId != null) {
            enrollments = enrollmentService.getEnrollmentsByStudent(studentId, pageable);
        } else {
            enrollments = enrollmentService.getAllEnrollments(pageable);
        }
        
        return ResponseEntity.ok(ApiResponse.success(enrollments));
    }

    /**
     * Create new enrollment (student self-enroll where policy allows).
     */
    @PostMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Enrollment>> createEnrollment(@RequestBody Map<String, Object> request,
                                                                   Authentication authentication) {
        Long courseId = request.containsKey("courseId")
                ? Long.valueOf(request.get("courseId").toString())
                : null;
        if (courseId == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("courseId is required", "MISSING_COURSE"));
        }

        Long studentId = request.containsKey("studentId") && request.get("studentId") != null
                ? Long.valueOf(request.get("studentId").toString())
                : getAuthenticatedUserId(authentication);

        if (studentId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Student context missing", "FORBIDDEN"));
        }

        if (hasAuthority(authentication, "ROLE_STUDENT") && !studentId.equals(getAuthenticatedUserId(authentication))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Students may only request their own enrollments", "FORBIDDEN"));
        }
        
        Enrollment enrollment = enrollmentService.createEnrollment(studentId, courseId);
        return ResponseEntity.ok(ApiResponse.success("Enrollment created successfully", enrollment));
    }

    /**
     * Reject enrollment with notification event.
     * Simplified endpoint for enrollment rejection UX.
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<Enrollment>> rejectEnrollment(@PathVariable Long id) {
        Enrollment enrollment = enrollmentService.rejectEnrollment(id);
        return ResponseEntity.ok(ApiResponse.success("Enrollment rejected.", enrollment));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<String>> deleteEnrollment(@PathVariable Long id, Authentication authentication) {
        Long studentId = getAuthenticatedUserId(authentication);
        if (studentId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Student context missing", "FORBIDDEN"));
        }
        enrollmentService.deleteEnrollment(id, studentId);
        return ResponseEntity.ok(ApiResponse.success("Enrollment removed", null));
    }

    @PostMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Enrollment>> withdrawEnrollment(@PathVariable Long id,
                                                                       @RequestBody Map<String, String> request,
                                                                       Authentication authentication) {
        Long studentId = getAuthenticatedUserId(authentication);
        if (studentId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Student context missing", "FORBIDDEN"));
        }
        String reason = request.getOrDefault("reason", "");
        Enrollment updated = enrollmentService.withdrawEnrollment(id, studentId, reason);
        return ResponseEntity.ok(ApiResponse.success("Withdrawal requested", updated));
    }

    /**
     * Update enrollment status with state machine validation.
     * Valid transitions: PENDING -> APPROVED -> ACTIVE -> COMPLETED or PENDING -> REJECTED
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<Enrollment>> updateEnrollmentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        
        String statusString = request.get("status");
        if (statusString == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Status is required", "MISSING_STATUS"));
        }
        
        EnrollmentStatus newStatus;
        try {
            newStatus = EnrollmentStatus.valueOf(statusString.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid status: " + statusString, "INVALID_STATUS"));
        }
        
        Enrollment enrollment = enrollmentService.updateEnrollmentStatus(id, newStatus);
        return ResponseEntity.ok(ApiResponse.success("Enrollment status updated successfully", enrollment));
    }

    /**
     * Get enrollment by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR') or " +
                  "(hasRole('STUDENT') and @enrollmentService.isStudentEnrollment(#id, authentication.details))")
    public ResponseEntity<ApiResponse<Enrollment>> getEnrollmentById(@PathVariable Long id) {
        Enrollment enrollment = enrollmentService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(enrollment));
    }

    private boolean hasAuthority(Authentication authentication, String authority) {
        if (authentication == null) {
            return false;
        }
        for (GrantedAuthority grantedAuthority : authentication.getAuthorities()) {
            if (authority.equals(grantedAuthority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    private Long getAuthenticatedUserId(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        Object details = authentication.getDetails();
        return details instanceof Long ? (Long) details : null;
    }
}
