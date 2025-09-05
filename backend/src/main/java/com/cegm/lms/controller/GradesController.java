package com.cegm.lms.controller;

import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.model.Grade;
import com.cegm.lms.service.GradeService;
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
 * Controller for grade management operations.
 * Implements SSoT requirements for grade filtering and instructor permissions.
 */
@RestController
@RequestMapping("/api/v1/grades")
@CrossOrigin
public class GradesController {

    @Autowired
    private GradeService gradeService;

    /**
     * Get grades with filtering by courseId, studentId, status.
     * Implements SSoT requirements for grade views.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<Page<Grade>>> getGrades(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String after,
            @RequestParam(defaultValue = "25") int size) {
        
        Sort sort = Sort.by("id").ascending();
        Pageable pageable = PageRequest.of(0, size, sort);
        
        Page<Grade> grades;
        
        if (courseId != null && studentId != null) {
            grades = gradeService.getGradesByCourseAndStudent(courseId, studentId, pageable);
        } else if (courseId != null) {
            grades = gradeService.getGradesByCourse(courseId, pageable);
        } else if (studentId != null) {
            grades = gradeService.getGradesByStudent(studentId, pageable);
        } else {
            grades = gradeService.getAllGrades(pageable);
        }
        
        return ResponseEntity.ok(ApiResponse.success(grades));
    }

    /**
     * Update grade - instructors limited to their courses.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or " +
                  "(hasRole('INSTRUCTOR') and @gradeService.isInstructorGrade(#id, authentication.details))")
    public ResponseEntity<ApiResponse<Grade>> updateGrade(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        
        Double score = null;
        String feedback = null;
        
        if (request.get("score") != null) {
            score = Double.valueOf(request.get("score").toString());
            
            // Validate score range (0-100 per SSoT)
            if (score < 0 || score > 100) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Score must be between 0 and 100", "INVALID_SCORE"));
            }
        }
        
        if (request.get("feedback") != null) {
            feedback = request.get("feedback").toString();
        }
        
        Grade grade = gradeService.updateGrade(id, score, feedback);
        return ResponseEntity.ok(ApiResponse.success("Grade updated successfully", grade));
    }

    /**
     * Get grade by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR') or " +
                  "(hasRole('STUDENT') and @gradeService.isStudentGrade(#id, authentication.details))")
    public ResponseEntity<ApiResponse<Grade>> getGradeById(@PathVariable Long id) {
        Grade grade = gradeService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(grade));
    }

    /**
     * Create new grade assignment.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<Grade>> createGrade(@RequestBody Map<String, Object> request) {
        Long enrollmentId = Long.valueOf(request.get("enrollmentId").toString());
        String assignmentName = request.get("assignmentName").toString();
        
        Double score = null;
        String feedback = null;
        
        if (request.get("score") != null) {
            score = Double.valueOf(request.get("score").toString());
            
            // Validate score range
            if (score < 0 || score > 100) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Score must be between 0 and 100", "INVALID_SCORE"));
            }
        }
        
        if (request.get("feedback") != null) {
            feedback = request.get("feedback").toString();
        }
        
        Grade grade = gradeService.createGrade(enrollmentId, assignmentName, score, feedback);
        return ResponseEntity.ok(ApiResponse.success("Grade created successfully", grade));
    }
}
