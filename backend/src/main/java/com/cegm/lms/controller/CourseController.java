package com.cegm.lms.controller;

import com.cegm.lms.dto.request.CourseCreateRequest;
import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.model.AuditLog;
import com.cegm.lms.model.Course;
import com.cegm.lms.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/courses")
@CrossOrigin
public class CourseController {

    @Autowired
    private CourseService courseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Course>>> getCourses(
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) String term,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean enrolled,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        if (Boolean.TRUE.equals(enrolled)) {
            Long currentUserId = getAuthenticatedUserId(authentication);
            if (currentUserId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Student session required", "FORBIDDEN"));
            }
            List<Course> studentCourses = courseService.findCoursesForStudent(currentUserId);
            return ResponseEntity.ok(ApiResponse.success(studentCourses));
        }
        
        List<Course> courses;
        if (ownerId != null || term != null || status != null) {
            // Apply filters - for now just return active courses
            // TODO: Implement filtering by owner, term, status
            courses = courseService.findActiveCourses();
        } else {
            courses = courseService.findActiveCourses();
        }
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<Course>>> getAllCourses(Pageable pageable) {
        Page<Course> courses = courseService.findAllCourses(pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Course>> getCourseById(@PathVariable Long id) {
        Course course = courseService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(course));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<Course>> getCourseByCode(@PathVariable String code) {
        Course course = courseService.findByCode(code);
        return ResponseEntity.ok(ApiResponse.success(course));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Course>>> searchCourses(@RequestParam String name) {
        List<Course> courses = courseService.searchCoursesByName(name);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Course>> createCourse(@Valid @RequestBody CourseCreateRequest request) {
        Course course = courseService.createCourse(request);
        return ResponseEntity.ok(ApiResponse.success("Course created successfully", course));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Course>> updateCourse(@PathVariable Long id, 
                                                           @Valid @RequestBody CourseCreateRequest request) {
        Course course = courseService.updateCourse(id, request);
        return ResponseEntity.ok(ApiResponse.success("Course updated successfully", course));
    }

    @PutMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Course>> archiveCourse(@PathVariable Long id) {
        Course course = courseService.archiveCourse(id);
        return ResponseEntity.ok(ApiResponse.success("Course archived successfully", course));
    }

    /**
     * Change course status.
     * Admin only access.
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Course>> changeCourseStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        
        String requestId = (String) httpRequest.getAttribute("X-Request-Id");
        
        String statusString = request.get("status");
        if (statusString == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Status is required", "MISSING_STATUS"));
        }
        
        // Validate status values (ACTIVE, ARCHIVED, DRAFT)
        if (!statusString.matches("^(ACTIVE|ARCHIVED|DRAFT)$")) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid status. Must be ACTIVE, ARCHIVED, or DRAFT", "INVALID_STATUS"));
        }
        
        Course course = courseService.changeCourseStatus(id, statusString, requestId);
        return ResponseEntity.ok(ApiResponse.success("Course status updated successfully", course));
    }

    /**
     * Get courses count.
     * Admin access.
     */
    @GetMapping("/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getCoursesCount() {
        int count = courseService.getCoursesCount();
        Map<String, Integer> result = Map.of("count", count);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}/audit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getCourseAuditHistory(@PathVariable Long id, Pageable pageable) {
        // Ensure course exists (throws if missing)
        courseService.findById(id);
        Page<AuditLog> logs = courseService.getCourseAuditLogs(id, pageable);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    private Long getAuthenticatedUserId(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        Object details = authentication.getDetails();
        return details instanceof Long ? (Long) details : null;
    }
}
