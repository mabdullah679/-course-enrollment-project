package com.cegm.lms.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to add security headers to all HTTP responses.
 * Implements the security header requirements from the SSoT.
 */
@Component
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        // Content Security Policy - restrictive policy for security
        response.setHeader("Content-Security-Policy", 
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data:; " +
            "connect-src 'self' https://localhost:8080; " +
            "frame-ancestors 'none'"
        );
        
        // Referrer Policy - no referrer information sent
        response.setHeader("Referrer-Policy", "no-referrer");
        
        // Permissions Policy - disable potentially dangerous features
        response.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
        
        // X-Content-Type-Options - prevent MIME type sniffing
        response.setHeader("X-Content-Type-Options", "nosniff");
        
        // X-Frame-Options - prevent clickjacking
        response.setHeader("X-Frame-Options", "DENY");
        
        filterChain.doFilter(request, response);
    }
}
