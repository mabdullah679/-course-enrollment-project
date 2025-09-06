package com.cegm.lms.controller;

import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.service.EnrollmentWindowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/config/enrollment-window")
public class EnrollmentWindowController {

    @Autowired
    private EnrollmentWindowService enrollmentWindowService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('INSTRUCTOR') or hasRole('STUDENT')")
    public ResponseEntity<Map<String, Object>> getEnrollmentWindow() {
        Map<String, Object> windowStatus = enrollmentWindowService.getEnrollmentWindowStatus();
        return ResponseEntity.ok(windowStatus);
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateEnrollmentWindow(
            @RequestBody Map<String, Object> request) {
        
        String status = (String) request.get("status");
        String term = (String) request.get("term");
        String startDate = (String) request.get("startDate");
        String endDate = (String) request.get("endDate");
        
        Map<String, Object> updatedWindow = enrollmentWindowService.updateEnrollmentWindow(
            status, term, startDate, endDate
        );
        
        return ResponseEntity.ok(updatedWindow);
    }
}