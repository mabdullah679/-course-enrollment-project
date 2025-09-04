package com.cegm.lms.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "auth")
public class JwtConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtConfig.class);
    
    private final Jwt jwt = new Jwt();
    private final Cookie cookie = new Cookie();
    
    public Jwt getJwt() {
        return jwt;
    }
    
    public Cookie getCookie() {
        return cookie;
    }
    
    public static class Jwt {
        private String secret;
        
        public String getSecret() {
            if (secret == null || secret.trim().isEmpty()) {
                logger.error("JWT secret is not configured in auth.jwt.secret");
                throw new IllegalStateException("JWT secret is not configured");
            }
            return secret;
        }
        
        public void setSecret(String secret) {
            this.secret = secret;
            logger.info("JWT secret configured: {}", secret != null ? "[SECRET SET]" : "[NOT SET]");
        }
    }
    
    public static class Cookie {
        private String name = "cegm_dev_session";
        
        public String getName() {
            return name;
        }
        
        public void setName(String name) {
            this.name = name;
            logger.info("Cookie name configured: {}", name);
        }
    }
}
