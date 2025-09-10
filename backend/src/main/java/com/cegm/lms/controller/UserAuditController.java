package com.cegm.lms.controller;

import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.model.AuditLog;
import com.cegm.lms.model.User;
import com.cegm.lms.repository.UserRepository;
import com.cegm.lms.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserAuditController {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public UserAuditController(UserRepository userRepository, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/{id}/audit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAudit(
            @PathVariable Long id,
            @RequestParam(required = false) String after,
            @RequestParam(defaultValue = "25") int limit) {
        
        // Verify user exists
        User user = userRepository.findById(id).orElseThrow(() -> 
            new RuntimeException("User not found"));
        
        // Create pageable with descending timestamp order to show latest events first
        Sort sort = Sort.by("timestamp").descending();
        Pageable pageable = PageRequest.of(0, limit, sort);
        
        // Get audit logs for the user
        Page<AuditLog> auditLogs = auditLogService.getLogsByUserId(id, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(auditLogs));
    }
}
