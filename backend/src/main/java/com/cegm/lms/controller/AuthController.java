package com.cegm.lms.controller;

import com.cegm.lms.dto.request.LoginRequest;
import com.cegm.lms.dto.request.SignUpRequest;
import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.dto.response.AuthResponse;
import com.cegm.lms.dto.response.UserResponse;
import com.cegm.lms.exception.UnauthorizedException;
import com.cegm.lms.model.User;
import com.cegm.lms.model.enums.UserRole;
import com.cegm.lms.security.JwtTokenProvider;
import com.cegm.lms.service.SsotConfigService;
import com.cegm.lms.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private SsotConfigService ssotConfigService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signUp(@Valid @RequestBody SignUpRequest request) {
        User user = userService.signUp(request);
        UserResponse userResponse = userService.convertToResponse(user);
        
        String message = user.getApproved() ? 
            "User registered successfully" : 
            "Signup request submitted. Admin approval required.";
            
        return ResponseEntity.ok(ApiResponse.success(message, userResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request, 
                                                          HttpServletResponse response) {
        // Additional input validation
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new UnauthorizedException("Username is required");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new UnauthorizedException("Password is required");
        }

        User user = userService.authenticateUser(request.getUsername().trim(), request.getPassword());
        
        String token;
        if (user.getRole() == UserRole.STUDENT) {
            token = tokenProvider.generateStudentToken(user.getUsername(), user.getId());
        } else {
            token = tokenProvider.generateAdminToken(user.getUsername(), user.getId());
        }

        // Set session cookie using dev configuration  
        Cookie sessionCookie = new Cookie(ssotConfigService.getDevCookieName(), token);
        sessionCookie.setHttpOnly(true);
        sessionCookie.setSecure(false); // Dev HTTP setting as per sprint-gui-auth.md
        sessionCookie.setPath("/");
        sessionCookie.setAttribute("SameSite", "Lax");
        sessionCookie.setMaxAge(24 * 60 * 60); // 24 hours
        response.addCookie(sessionCookie);

        UserResponse userResponse = userService.convertToResponse(user);
        AuthResponse authResponse = new AuthResponse(token, userResponse);
        
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletResponse response) {
        // Clear session cookie using dev configuration
        Cookie sessionCookie = new Cookie(ssotConfigService.getDevCookieName(), "");
        sessionCookie.setHttpOnly(true);
        sessionCookie.setSecure(false);
        sessionCookie.setPath("/");
        sessionCookie.setMaxAge(0);
        response.addCookie(sessionCookie);

        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(HttpServletRequest request) {
        String token = extractTokenFromRequest(request);
        if (token == null) {
            throw new UnauthorizedException("Invalid or missing token");
        }
        
        // Use single secret validation (Option A)
        if (!tokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Invalid token");
        }
        
        String username = tokenProvider.getUsernameFromToken(token);
        if (username == null) {
            throw new UnauthorizedException("Invalid token");
        }
        
        User user = userService.findByUsername(username);
        UserResponse userResponse = userService.convertToResponse(user);
        return ResponseEntity.ok(ApiResponse.success(userResponse));
    }

    @PostMapping("/rotate")
    public ResponseEntity<ApiResponse<String>> rotateSession(HttpServletRequest request, HttpServletResponse response) {
        // Optional refresh rotation endpoint
        String token = extractTokenFromRequest(request);
        if (token == null) {
            throw new UnauthorizedException("Invalid or missing token");
        }
        
        // Validate current token using single secret (Option A)
        if (!tokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Invalid token");
        }
        
        String username = tokenProvider.getUsernameFromToken(token);
        if (username == null) {
            throw new UnauthorizedException("Invalid token");
        }
        
        User user = userService.findByUsername(username);
        String newToken = tokenProvider.generateAdminToken(user.getUsername(), user.getId());
        
        // Set new cookie using dev configuration
        Cookie sessionCookie = new Cookie(ssotConfigService.getDevCookieName(), newToken);
        sessionCookie.setHttpOnly(true);
        sessionCookie.setSecure(false); // Dev HTTP setting
        sessionCookie.setPath("/");
        sessionCookie.setAttribute("SameSite", "Lax");
        sessionCookie.setMaxAge(24 * 60 * 60);
        response.addCookie(sessionCookie);
        
        return ResponseEntity.ok(ApiResponse.success("Session rotated successfully"));
    }

    /**
     * Update current user's profile.
     */
    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @RequestBody Map<String, String> request, 
            HttpServletRequest httpRequest) {
        
        String requestId = (String) httpRequest.getAttribute("X-Request-Id");
        String token = extractTokenFromRequest(httpRequest);
        
        if (token == null || !tokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Invalid or missing token");
        }
        
        String username = tokenProvider.getUsernameFromToken(token);
        User user = userService.findByUsername(username);
        
        // Update fields that are provided
        boolean updated = false;
        if (request.containsKey("firstName") && request.get("firstName") != null) {
            user.setFirstName(request.get("firstName"));
            updated = true;
        }
        if (request.containsKey("lastName") && request.get("lastName") != null) {
            user.setLastName(request.get("lastName"));
            updated = true;
        }
        if (request.containsKey("email") && request.get("email") != null) {
            String newEmail = request.get("email");
            // Validate email format and uniqueness
            if (!newEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid email format", "INVALID_EMAIL"));
            }
            if (!user.getEmail().equals(newEmail) && userService.existsByEmail(newEmail)) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Email already exists", "EMAIL_EXISTS"));
            }
            user.setEmail(newEmail);
            updated = true;
        }
        
        if (!updated) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("No valid fields provided for update", "NO_FIELDS"));
        }
        
        User savedUser = userService.updateProfile(user, requestId);
        UserResponse userResponse = userService.convertToResponse(savedUser);
        
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", userResponse));
    }

    /**
     * Change current user's password.
     */
    @PostMapping("/me/password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @RequestBody Map<String, String> request, 
            HttpServletRequest httpRequest) {
        
        String requestId = (String) httpRequest.getAttribute("X-Request-Id");
        String token = extractTokenFromRequest(httpRequest);
        
        if (token == null || !tokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Invalid or missing token");
        }
        
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");
        
        if (currentPassword == null || currentPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Current password is required", "MISSING_CURRENT_PASSWORD"));
        }
        
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("New password is required", "MISSING_NEW_PASSWORD"));
        }
        
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("New password must be at least 6 characters", "PASSWORD_TOO_SHORT"));
        }
        
        String username = tokenProvider.getUsernameFromToken(token);
        
        try {
            userService.changePassword(username, currentPassword, newPassword, requestId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Current password is incorrect", "WRONG_CURRENT_PASSWORD"));
        }
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        // First try to get from cookie using dev configuration
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookie.getName().equals(ssotConfigService.getDevCookieName())) {
                    return cookie.getValue();
                }
            }
        }
        
        // Fallback to Authorization header
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        
        return null;
    }
}
