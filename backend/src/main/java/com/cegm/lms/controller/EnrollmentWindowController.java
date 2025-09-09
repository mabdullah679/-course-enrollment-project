package com.cegm.lms.controller;

import com.cegm.lms.dto.EnrollmentWindowUpdateRequest;
import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.service.EnrollmentWindowService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/enrollment-window")
public class EnrollmentWindowController {

    private final EnrollmentWindowService enrollmentWindowService;

    public EnrollmentWindowController(EnrollmentWindowService enrollmentWindowService) {
        this.enrollmentWindowService = enrollmentWindowService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String,Object>>> getEnrollmentWindow() {
        var data = enrollmentWindowService.getEnrollmentWindowStatus();
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String,Object>>> updateEnrollmentWindow(
            @Valid @RequestBody EnrollmentWindowUpdateRequest req) {

        var updated = enrollmentWindowService.updateEnrollmentWindow(
                req.getStatus(), req.getTerm(), req.getStartDate(), req.getEndDate()
        );
        return ResponseEntity.ok(ApiResponse.success("Enrollment window updated successfully", updated));
    }
}
