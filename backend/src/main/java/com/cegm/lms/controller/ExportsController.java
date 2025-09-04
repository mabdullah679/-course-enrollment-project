package com.cegm.lms.controller;

import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.service.ExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for data export operations.
 * Implements SSoT requirements for policy checks, rate limiting, and CSV sanitization.
 */
@RestController
@RequestMapping("/api/v1/exports")
@CrossOrigin
public class ExportsController {

    @Autowired
    private ExportService exportService;

    /**
     * Export data to CSV with policy checks, rate limiting, and sanitization.
     * Subject to the same access controls as list endpoints.
     */
    @PostMapping("/csv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> exportToCsv(@RequestBody Map<String, Object> request) {
        String resource = (String) request.get("resource");
        if (resource == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Resource is required", "MISSING_RESOURCE"));
        }

        Map<String, Object> filters = (Map<String, Object>) request.get("filters");
        if (filters == null) {
            filters = Map.of();
        }

        try {
            // Generate CSV with policy checks and sanitization
            String csvContent = exportService.exportToCsv(resource, filters);
            
            // Set appropriate headers for CSV download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", resource + "_export.csv");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(csvContent);
                
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid resource: " + resource, "INVALID_RESOURCE"));
        } catch (SecurityException e) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Access denied for export", "EXPORT_DENIED"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Export failed: " + e.getMessage(), "EXPORT_ERROR"));
        }
    }
}
