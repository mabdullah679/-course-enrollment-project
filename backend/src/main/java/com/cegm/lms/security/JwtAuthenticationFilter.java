package com.cegm.lms.security;

import com.cegm.lms.service.SsotConfigService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private SsotConfigService ssotConfigService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        // Diagnostic logging as per spring-jwt-debug.md
        String method = request.getMethod();
        String path = request.getRequestURI();
        String userAgent = request.getHeader("User-Agent");
        String requestId = java.util.UUID.randomUUID().toString().substring(0, 8);
        
        logger.debug("JWT Filter: method={}, path={}, request_id={}, User-Agent={}", 
                method, path, requestId, userAgent);
        
        String token = getJwtFromRequest(request);
        
        if (token != null) {
            logger.debug("JWT token found in request: request_id={}", requestId);
            
            // Option A: Use single secret for all token validation
            if (tokenProvider.validateToken(token)) {
                String username = tokenProvider.getUsernameFromToken(token);
                Long userId = tokenProvider.getUserIdFromToken(token);
                Boolean isStudent = tokenProvider.getIsStudentFromToken(token);
                
                if (username != null && userId != null && isStudent != null) {
                    String authority = isStudent ? "ROLE_STUDENT" : "ROLE_ADMIN";
                    
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(
                            username, 
                            null, 
                            List.of(new SimpleGrantedAuthority(authority))
                        );
                    authentication.setDetails(userId);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    
                    logger.debug("Authentication successful: request_id={}, username={}, role={}, verifier_key=single-dev-secret", 
                            requestId, username, authority);
                } else {
                    logger.warn("Token validation passed but claims extraction failed: request_id={}", requestId);
                }
            } else {
                logger.warn("Token validation failed: request_id={}", requestId);
            }
        } else {
            logger.debug("No JWT token found in request: request_id={}", requestId);
        }
        
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        // First try Authorization header
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            logger.debug("JWT found in Authorization header");
            return bearerToken.substring(7);
        }
        
        // Then try session cookie with the configured name
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            String cookieName = ssotConfigService.getDevCookieName();
            logger.debug("Looking for cookie: {}", cookieName);
            for (Cookie cookie : cookies) {
                if (cookieName.equals(cookie.getName())) {
                    logger.debug("JWT found in cookie: {}", cookieName);
                    return cookie.getValue();
                }
            }
        }
        
        return null;
    }
}
