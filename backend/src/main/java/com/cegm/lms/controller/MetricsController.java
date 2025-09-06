package com.cegm.lms.controller;

import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.service.MetricsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/metrics")
public class MetricsController {

    @Autowired
    private MetricsService metricsService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Map<String, Object>> getUsersCount() {
        long count = metricsService.getUsersCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/courses")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('INSTRUCTOR')")
    public ResponseEntity<Map<String, Object>> getCoursesCount() {
        long count = metricsService.getCoursesCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/enrollments")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Map<String, Object>> getEnrollmentsCount() {
        long count = metricsService.getEnrollmentsCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/grades")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('INSTRUCTOR')")
    public ResponseEntity<Map<String, Object>> getGradesCount() {
        long count = metricsService.getGradesCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Map<String, Object>> getDashboardMetrics() {
        Map<String, Object> metrics = metricsService.getDashboardMetrics();
        return ResponseEntity.ok(metrics);
    }
}