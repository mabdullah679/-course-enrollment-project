package com.cegm.lms.controller;

import com.cegm.lms.dto.request.CourseCreateRequest;
import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.dto.response.AuditResponse;
import com.cegm.lms.dto.response.CourseMinimalResponse;
import com.cegm.lms.dto.response.CourseResponse;
import com.cegm.lms.model.Course;
import com.cegm.lms.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/courses")
@CrossOrigin
public class CourseController {

    @Autowired
    private CourseService courseService;

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getCourses(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String term,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) Boolean assignable,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long after) {
        
        List<CourseResponse> courses = courseService.findCoursesWithFilters(
            q, status, term, ownerId, assignable, size, after);
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/minimal")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<CourseMinimalResponse>> getCoursesMinimal(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "100") int size) {
        
        List<CourseMinimalResponse> courses = courseService.findCoursesMinimal(status, size);
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Page<Course>>> getAllCourses(Pageable pageable) {
        Page<Course> courses = courseService.findAllCourses(pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Course>> getCourseById(@PathVariable Long id) {
        Course course = courseService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(course));
    }

    @GetMapping("/{id}/audit")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<AuditResponse>> getCourseAudit(@PathVariable Long id) {
        List<AuditResponse> auditHistory = courseService.getCourseAuditHistory(id);
        return ResponseEntity.ok(auditHistory);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseResponse> updateCourseStatus(@PathVariable Long id, 
                                                           @RequestBody Map<String, String> request) {
        String status = request.get("status");
        CourseResponse course = courseService.updateCourseStatus(id, status);
        return ResponseEntity.ok(course);
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
        return ResponseEntity.ok(ApiResponse.success("Course inactivated successfully", course));
    }
}
