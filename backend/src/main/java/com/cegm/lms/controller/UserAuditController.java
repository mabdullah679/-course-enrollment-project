package com.cegm.lms.controller;

import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.model.User;
import com.cegm.lms.repository.UserAuditRepository;
import com.cegm.lms.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserAuditController {

    private final UserRepository userRepository;
    private final UserAuditRepository userAuditRepository;

    public UserAuditController(UserRepository userRepository, UserAuditRepository userAuditRepository) {
        this.userRepository = userRepository;
        this.userAuditRepository = userAuditRepository;
    }

    @GetMapping("/{id}/audit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<?>> getAudit(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow();
        var items = userAuditRepository.findByUserOrderByCreatedAtDesc(user);
        return ResponseEntity.ok(ApiResponse.success(items));
    }
}
