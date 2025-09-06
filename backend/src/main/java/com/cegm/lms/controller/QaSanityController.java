package com.cegm.lms.controller;

import com.cegm.lms.service.MetricsService;
import com.cegm.lms.service.EnrollmentWindowService;
import com.cegm.lms.repository.CourseRepository;
import com.cegm.lms.repository.EnrollmentRepository;
import com.cegm.lms.repository.GradeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Profile("dev") // Only available in dev environment
public class QaSanityController {

    @Autowired
    private MetricsService metricsService;
    
    @Autowired
    private EnrollmentWindowService enrollmentWindowService;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private EnrollmentRepository enrollmentRepository;
    
    @Autowired
    private GradeRepository gradeRepository;

    /**
     * QA Sanity check endpoint - dev only, publicly accessible
     * Returns current system state for verification
     */
    @GetMapping("/_qa-sanity")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Map<String, Object>> qaSanityCheck() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get seeded data counts
            long seededCourses = courseRepository.count();
            long seededEnrollments = enrollmentRepository.count();
            long seededGrades = gradeRepository.count();
            
            // Get enrollment window state
            Map<String, Object> windowStatus = enrollmentWindowService.getEnrollmentWindowStatus();
            String rawState = (String) windowStatus.get("state");
            // Map ON/OFF to OPEN/CLOSED as expected by the problem statement
            String windowState = "ON".equals(rawState) ? "OPEN" : "CLOSED";
            
            // Get dashboard metrics
            Map<String, Object> counts = new HashMap<>();
            counts.put("users", metricsService.getUsersCount());
            counts.put("courses", metricsService.getCoursesCount());
            counts.put("enrollments", metricsService.getEnrollmentsCount());
            
            // Build response
            response.put("seededCourses", seededCourses);
            response.put("seededEnrollments", seededEnrollments);
            response.put("seededGrades", seededGrades);
            response.put("windowState", windowState);
            response.put("counts", counts);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Return error information for debugging
            response.put("error", e.getMessage());
            response.put("status", "ERROR");
            return ResponseEntity.internalServerError().body(response);
        }
    }
}