package com.cegm.lms.controller;

import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.dto.response.UserResponse;
import com.cegm.lms.model.User;
import com.cegm.lms.model.enums.UserRole;
import com.cegm.lms.service.SessionManagementService;
import com.cegm.lms.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for user management operations.
 * All endpoints require proper authorization as per SSoT requirements.
 */
@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin
public class UsersController {

    @Autowired
    private UserService userService;

    @Autowired
    private SessionManagementService sessionManagementService;

    /**
     * Get all users with keyset pagination and filtering.
     * Admin only access.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(
            @RequestParam(required = false) String after,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean approved,
            @RequestParam(required = false) Boolean active) {
        
        // Implement keyset pagination using 'after' cursor
        Sort sort = Sort.by("id").ascending();
        Pageable pageable = PageRequest.of(0, size, sort);
        
        Page<User> users;
        
        // Apply filters based on query parameters
        if (q != null && !q.trim().isEmpty()) {
            users = userService.searchUsers(q.trim(), pageable);
        } else if (role != null) {
            users = userService.getUsersByRole(role, pageable);
        } else if (approved != null) {
            users = userService.getUsersByApprovalStatus(approved, pageable);
        } else if (active != null) {
            users = userService.getUsersByActiveStatus(active, pageable);
        } else {
            users = userService.getAllUsers(pageable);
        }
        
        Page<UserResponse> userResponses = users.map(userService::convertToResponse);
        return ResponseEntity.ok(ApiResponse.success(userResponses));
    }

    /**
     * Approve a user by ID.
     * Admin only access.
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> approveUser(@PathVariable Long id) {
        User user = userService.approveUser(id);
        UserResponse userResponse = userService.convertToResponse(user);
        return ResponseEntity.ok(ApiResponse.success("User approved successfully", userResponse));
    }

    /**
     * Change user role with session rotation.
     * Admin only access.
     */
    @PostMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> changeUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        
        String requestId = (String) httpRequest.getAttribute("X-Request-Id");
        
        String roleString = request.get("role");
        if (roleString == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Role is required", "MISSING_ROLE"));
        }
        
        UserRole newRole;
        try {
            newRole = UserRole.valueOf(roleString.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid role: " + roleString, "INVALID_ROLE"));
        }
        
        // Update user role with audit logging including request ID
        User user = userService.changeUserRole(id, newRole, requestId);
        
        // Rotate session if this is the current user
        Object details = SecurityContextHolder.getContext().getAuthentication().getDetails();
        if (details instanceof Long currentUserId && currentUserId.equals(id)) {
            sessionManagementService.changeUserRole(id, newRole, response);
        }
        
        UserResponse userResponse = userService.convertToResponse(user);
        return ResponseEntity.ok(ApiResponse.success("User role changed successfully", userResponse));
    }

    /**
     * Change user status (approved/active).
     * Admin only access.
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> changeUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request,
            HttpServletRequest httpRequest) {
        
        String requestId = (String) httpRequest.getAttribute("X-Request-Id");
        
        Boolean approved = request.get("approved");
        Boolean active = request.get("active");
        
        if (approved == null && active == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("At least one of 'approved' or 'active' must be provided", "MISSING_STATUS_FIELDS"));
        }
        
        User user = userService.changeUserStatus(id, approved, active, requestId);
        UserResponse userResponse = userService.convertToResponse(user);
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", userResponse));
    }

    /**
     * Get user audit history.
     * Admin only access.
     */
    @GetMapping("/{id}/audit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Object>> getUserAuditHistory(
            @PathVariable Long id,
            @RequestParam(required = false) String after,
            @RequestParam(defaultValue = "25") int limit) {
        
        // For now return empty audit history with proper structure
        // TODO: Implement actual audit logging system
        Object auditHistory = userService.getUserAuditHistory(id, after, limit);
        return ResponseEntity.ok(ApiResponse.success(auditHistory));
    }

    /**
     * Get user by ID.
     * Self-readable for the owner, admin can read any.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('STUDENT') and #id == authentication.details)")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        User user = userService.findById(id);
        UserResponse userResponse = userService.convertToResponse(user);
        return ResponseEntity.ok(ApiResponse.success(userResponse));
    }
}
