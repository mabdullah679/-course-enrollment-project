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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Page<Enrollment>>> getEnrollments(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
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
    public ResponseEntity<ApiResponse<Enrollment>> createEnrollment(@RequestBody Map<String, Object> request) {
        Long courseId = Long.valueOf(request.get("courseId").toString());
        Long studentId = Long.valueOf(request.get("studentId").toString());
        
        Enrollment enrollment = enrollmentService.createEnrollment(studentId, courseId);
        return ResponseEntity.ok(ApiResponse.success("Enrollment created successfully", enrollment));
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
}
