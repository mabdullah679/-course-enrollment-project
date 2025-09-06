package com.cegm.lms.controller;

import com.cegm.lms.dto.response.ErrorResponse;
import com.cegm.lms.model.Grade;
import com.cegm.lms.service.GradeService;
import com.cegm.lms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me")
@CrossOrigin
public class MeController {

    @Autowired
    private GradeService gradeService;

    @Autowired
    private UserService userService;

    @GetMapping("/grades")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<Grade>> getMyGrades(
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long after,
            Authentication authentication) {
        
        // Get current user ID from authentication
        Long studentId = (Long) authentication.getDetails();
        
        List<Grade> grades = gradeService.getGradesByStudentId(studentId, size, after);
        return ResponseEntity.ok(grades);
    }

    @PostMapping("/password")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN') or hasRole('INSTRUCTOR') or hasRole('STAFF')")
    public ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");
        
        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("PASSWORD_MISMATCH", "Current password and new password are required"));
        }
        
        try {
            Long userId = (Long) authentication.getDetails();
            userService.changePassword(userId, currentPassword, newPassword);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("weak")) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("WEAK_PASSWORD", e.getMessage()));
            } else if (e.getMessage().contains("invalid")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("INVALID_CURRENT_PASSWORD", e.getMessage()));
            } else {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("PASSWORD_MISMATCH", e.getMessage()));
            }
        }
    }
}