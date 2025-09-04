package com.cegm.lms.security;

import com.cegm.lms.service.SsotConfigService;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {
    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Autowired
    private SsotConfigService ssotConfigService;

    public String generateStudentToken(String username, Long userId) {
        return generateToken(username, userId, true);
    }

    public String generateAdminToken(String username, Long userId) {
        return generateToken(username, userId, false);
    }

    private String generateToken(String username, Long userId, boolean isStudent) {
        try {
            // Option A: Use single dev secret for all tokens
            String secret = ssotConfigService.getDevJwtSecret();
            long expirationTime = ssotConfigService.getDevJwtExpirationMillis();

            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + expirationTime);

            logger.debug("Generating JWT token: username={}, userId={}, isStudent={}, verifier_key=single-dev-secret", 
                username, userId, isStudent);

            return Jwts.builder()
                    .subject(username)
                    .claim("userId", userId)
                    .claim("isStudent", isStudent)
                    .issuedAt(now)
                    .expiration(expiryDate)
                    .signWith(key)
                    .compact();
        } catch (Exception e) {
            logger.error("Error generating JWT token", e);
            throw new RuntimeException("Could not generate token", e);
        }
    }

    public String getUsernameFromToken(String token) {
        try {
            // Option A: Use single dev secret for all token verification
            String secret = ssotConfigService.getDevJwtSecret();
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());
            
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            logger.debug("Extracted username from token: verifier_key=single-dev-secret");
            return claims.getSubject();
        } catch (Exception e) {
            logger.error("Error extracting username from token: verifier_key=single-dev-secret", e);
            return null;
        }
    }

    public Long getUserIdFromToken(String token) {
        try {
            // Option A: Use single dev secret for all token verification
            String secret = ssotConfigService.getDevJwtSecret();
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());
            
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            logger.debug("Extracted userId from token: verifier_key=single-dev-secret");
            return claims.get("userId", Long.class);
        } catch (Exception e) {
            logger.error("Error extracting user ID from token: verifier_key=single-dev-secret", e);
            return null;
        }
    }

    public Boolean getIsStudentFromToken(String token) {
        try {
            // Option A: Use single dev secret for all token verification
            String secret = ssotConfigService.getDevJwtSecret();
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());
            
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            logger.debug("Extracted isStudent from token: verifier_key=single-dev-secret");
            return claims.get("isStudent", Boolean.class);
        } catch (Exception e) {
            logger.error("Error extracting isStudent from token: verifier_key=single-dev-secret", e);
            return null;
        }
    }

    public boolean validateToken(String token) {
        try {
            // Option A: Use single dev secret for all token verification
            String secret = ssotConfigService.getDevJwtSecret();
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());
            
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            
            logger.debug("Token validation successful: verifier_key=single-dev-secret");
            return true;
        } catch (SecurityException ex) {
            logger.error("Invalid JWT signature: verifier_key=single-dev-secret", ex);
        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token: verifier_key=single-dev-secret", ex);
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token: verifier_key=single-dev-secret", ex);
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token: verifier_key=single-dev-secret", ex);
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty: verifier_key=single-dev-secret", ex);
        }
        return false;
    }

    // Legacy methods for backward compatibility - they now use the single secret
    @Deprecated
    public String getUsernameFromToken(String token, boolean isStudent) {
        logger.debug("Using legacy getUsernameFromToken method - redirecting to single secret");
        return getUsernameFromToken(token);
    }

    @Deprecated
    public Long getUserIdFromToken(String token, boolean isStudent) {
        logger.debug("Using legacy getUserIdFromToken method - redirecting to single secret");
        return getUserIdFromToken(token);
    }

    @Deprecated
    public boolean validateToken(String token, boolean isStudent) {
        logger.debug("Using legacy validateToken method - redirecting to single secret");
        return validateToken(token);
    }
}
