package com.cegm.lms.controller;

import com.cegm.lms.service.CourseService;
import com.cegm.lms.service.GradeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin
public class InstructorController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private GradeService gradeService;

    @PostMapping("/instructor-assignments/requests")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<Map<String, String>> requestAssignment(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Long> courseIds = (List<Long>) request.get("courseIds");
        String term = (String) request.get("term");
        
        // Generate a request ID for tracking
        String requestId = "req_" + UUID.randomUUID().toString().substring(0, 8);
        
        // For now, just return accepted response
        // TODO: Implement actual assignment logic
        return ResponseEntity.accepted()
            .body(Map.of("requestId", requestId));
    }

    @GetMapping("/instructors/{id}/gradebook")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
    public ResponseEntity<List<Map<String, Object>>> getInstructorGradebook(
            @PathVariable Long id,
            @RequestParam(required = false) Long courseId,
            @RequestParam(defaultValue = "25") int size) {
        
        // For now, return empty list
        // TODO: Implement actual gradebook logic
        return ResponseEntity.ok(List.of());
    }
}