package com.cegm.lms.service;

import com.cegm.lms.model.User;
import com.cegm.lms.model.enums.UserRole;
import com.cegm.lms.security.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Service for managing user sessions, role changes, and session rotation.
 * Implements session fixation protection by regenerating session IDs.
 */
@Service
public class SessionManagementService {

    @Autowired
    private SsotConfigService ssotConfigService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    private final SecureRandom secureRandom = new SecureRandom();
    
    // Track session IDs to detect changes
    private final ConcurrentMap<Long, String> userSessionIds = new ConcurrentHashMap<>();

    /**
     * Generates a new session after login with session fixation protection.
     */
    public String createSessionAfterLogin(User user, HttpServletResponse response) {
        // Generate new session ID
        String sessionId = generateSessionId();
        userSessionIds.put(user.getId(), sessionId);
        
        // Generate new token
        String token = generateTokenForUser(user);
        
        // Set cookie with new token
        setCookieWithRotation(token, response);
        
        return token;
    }

    /**
     * Handles role change with session rotation.
     */
    public String changeUserRole(Long userId, UserRole newRole, HttpServletResponse response) {
        // Generate new session ID (session fixation protection)
        String newSessionId = generateSessionId();
        String oldSessionId = userSessionIds.put(userId, newSessionId);
        
        // Verify session ID actually changed
        if (newSessionId.equals(oldSessionId)) {
            throw new IllegalStateException("Session ID rotation failed");
        }
        
        // This would typically update the user in the database
        // For now, we'll create a temporary user object with the new role
        User userWithNewRole = new User();
        userWithNewRole.setId(userId);
        userWithNewRole.setRole(newRole);
        
        // Generate new token with new role
        String newToken = generateTokenForUser(userWithNewRole);
        
        // Set new cookie
        setCookieWithRotation(newToken, response);
        
        // Publish role change event for cache invalidation
        eventPublisher.publishEvent(new RoleChangeEvent(userId, newRole, oldSessionId, newSessionId));
        
        return newToken;
    }

    /**
     * Clears session on logout.
     */
    public void clearSession(Long userId, HttpServletResponse response) {
        userSessionIds.remove(userId);
        clearCookie(response);
    }

    /**
     * Gets current session ID for a user.
     */
    public String getCurrentSessionId(Long userId) {
        return userSessionIds.get(userId);
    }

    /**
     * Verifies that session ID has rotated.
     */
    public boolean hasSessionIdRotated(Long userId, String oldSessionId) {
        String currentSessionId = userSessionIds.get(userId);
        return !oldSessionId.equals(currentSessionId);
    }

    private String generateSessionId() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String generateTokenForUser(User user) {
        if (user.getRole() == UserRole.STUDENT) {
            return tokenProvider.generateStudentToken(user.getUsername(), user.getId());
        } else {
            return tokenProvider.generateAdminToken(user.getUsername(), user.getId());
        }
    }

    private void setCookieWithRotation(String token, HttpServletResponse response) {
        // Clear old cookie first
        clearCookie(response);
        
        // Get cookie name from SSoT config - no __Host- prefix in dev HTTP mode
        String cookieName = ssotConfigService.getSessionCookieName();
        Cookie sessionCookie = new Cookie(cookieName, token);
        sessionCookie.setHttpOnly(true);
        sessionCookie.setSecure(false); // false for dev HTTP, as per sprint requirements
        sessionCookie.setPath("/");
        sessionCookie.setAttribute("SameSite", "Lax");
        sessionCookie.setMaxAge(24 * 60 * 60); // 24 hours
        response.addCookie(sessionCookie);
    }

    private void clearCookie(HttpServletResponse response) {
        String cookieName = ssotConfigService.getSessionCookieName();
        Cookie clearCookie = new Cookie(cookieName, "");
        clearCookie.setHttpOnly(true);
        clearCookie.setSecure(false);
        clearCookie.setPath("/");
        clearCookie.setMaxAge(0);
        response.addCookie(clearCookie);
    }

    /**
     * Event class for role changes.
     */
    public static class RoleChangeEvent {
        private final Long userId;
        private final UserRole newRole;
        private final String oldSessionId;
        private final String newSessionId;

        public RoleChangeEvent(Long userId, UserRole newRole, String oldSessionId, String newSessionId) {
            this.userId = userId;
            this.newRole = newRole;
            this.oldSessionId = oldSessionId;
            this.newSessionId = newSessionId;
        }

        public Long getUserId() { return userId; }
        public UserRole getNewRole() { return newRole; }
        public String getOldSessionId() { return oldSessionId; }
        public String getNewSessionId() { return newSessionId; }
    }
}
