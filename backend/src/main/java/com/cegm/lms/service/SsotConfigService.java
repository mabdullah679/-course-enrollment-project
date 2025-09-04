package com.cegm.lms.service;

import com.cegm.lms.config.JwtConfig;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.Map;

@Service
public class SsotConfigService {

    private static final Logger logger = LoggerFactory.getLogger(SsotConfigService.class);

    @Resource(name = "cegmSsotConfig")
    private Map<String, Object> ssotConfig;
    private Map<String, Object> services;
    
    @Autowired
    private JwtConfig jwtConfig;

    @PostConstruct
    public void init() {
        if (ssotConfig == null) {
            logger.error("SSoT config bean is null at startup! Application cannot function.");
            throw new IllegalStateException("SSoT config bean is null at startup!");
        }
        logger.info("SSoT config loaded at startup. Actual class: {}. Top-level keys: {}",
                ssotConfig.getClass().getName(), ssotConfig.keySet());

        // Handle nested config if wrapped in ssotConfig key
        Map<String, Object> actualConfig = ssotConfig;
        if (ssotConfig.size() == 1 && ssotConfig.containsKey("ssotConfig")) {
            actualConfig = (Map<String, Object>) ssotConfig.get("ssotConfig");
            logger.info("Unwrapped nested ssotConfig, actual keys: {}", actualConfig.keySet());
            // Replace the ssotConfig reference with the unwrapped version
            this.ssotConfig = actualConfig;
        }

        Object svc = actualConfig.get("services");
        if (svc instanceof Map) {
            services = (Map<String, Object>) svc;
        }
        if (services == null) {
            services = new java.util.HashMap<>();
        }
        if (actualConfig.get("security") == null) {
            logger.error("SSoT config missing 'security' section at startup! Check your YAML file. Available keys: {}", actualConfig.keySet());
            throw new IllegalStateException("SSoT config missing 'security' section at startup!");
        }
        logger.info("SSoT config initialization successful. Security section found.");
    }

    @SuppressWarnings("unchecked")
    public String getStudentErrorMessage() {
        Map<String, Object> services = (Map<String, Object>) ssotConfig.get("services");
        Map<String, Object> globalErrorHandling = (Map<String, Object>) services.get("GlobalErrorHandlingService");
        return (String) globalErrorHandling.get("studentErrorMessage");
    }

    @SuppressWarnings("unchecked")
    public String getSessionCookieName() {
        Map<String, Object> security = (Map<String, Object>) ssotConfig.get("security");
        if (security == null) throw new IllegalStateException("SSoT config missing 'security' section");
        Map<String, Object> sessionCookie = (Map<String, Object>) security.get("sessionCookie");
        String rawValue = (String) sessionCookie.get("name");
        return resolveEnvironmentVariable(rawValue);
    }

    @SuppressWarnings("unchecked")
    public List<String> getCorsAllowedOrigins() {
        Map<String, Object> security = (Map<String, Object>) ssotConfig.get("security");
        if (security == null) throw new IllegalStateException("SSoT config missing 'security' section");
        Map<String, Object> cors = (Map<String, Object>) security.get("cors");
        return (List<String>) cors.get("allowedOrigins");
    }

    @SuppressWarnings("unchecked")
    public String getStudentJwtSecret() {
        Map<String, Object> security = (Map<String, Object>) ssotConfig.get("security");
        if (security == null) {
            logger.error("SSoT config missing 'security' section when accessing getStudentJwtSecret!");
            throw new IllegalStateException("SSoT config missing 'security' section");
        }
        Map<String, Object> jwt = (Map<String, Object>) security.get("jwt");
        Map<String, Object> student = (Map<String, Object>) jwt.get("student");
        String rawValue = (String) student.get("secret");
        return resolveEnvironmentVariable(rawValue);
    }

    @SuppressWarnings("unchecked")
    public String getAdminJwtSecret() {
        Map<String, Object> security = (Map<String, Object>) ssotConfig.get("security");
        if (security == null) {
            logger.error("SSoT config missing 'security' section when accessing getAdminJwtSecret!");
            throw new IllegalStateException("SSoT config missing 'security' section");
        }
        Map<String, Object> jwt = (Map<String, Object>) security.get("jwt");
        Map<String, Object> admin = (Map<String, Object>) jwt.get("admin");
        String rawValue = (String) admin.get("secret");
        return resolveEnvironmentVariable(rawValue);
    }

    @SuppressWarnings("unchecked")
    public long getStudentJwtExpirationMillis() {
        Map<String, Object> security = (Map<String, Object>) ssotConfig.get("security");
        if (security == null) throw new IllegalStateException("SSoT config missing 'security' section");
        Map<String, Object> jwt = (Map<String, Object>) security.get("jwt");
        Map<String, Object> student = (Map<String, Object>) jwt.get("student");
        String expiresIn = (String) student.get("expiresIn");
        return parseTimeToMillis(expiresIn);
    }

    @SuppressWarnings("unchecked")
    public long getAdminJwtExpirationMillis() {
        Map<String, Object> security = (Map<String, Object>) ssotConfig.get("security");
        if (security == null) throw new IllegalStateException("SSoT config missing 'security' section");
        Map<String, Object> jwt = (Map<String, Object>) security.get("jwt");
        Map<String, Object> admin = (Map<String, Object>) jwt.get("admin");
        String expiresIn = (String) admin.get("expiresIn");
        return parseTimeToMillis(expiresIn);
    }

    /**
     * Get the single JWT secret for dev mode (Option A as per spring-jwt-debug.md)
     * This uses Spring Boot configuration properties from application-dev.yml
     */
    public String getDevJwtSecret() {
        logger.debug("Using single dev JWT secret from Spring configuration");
        return jwtConfig.getJwt().getSecret();
    }

    /**
     * Get the cookie name from Spring Boot configuration properties
     */
    public String getDevCookieName() {
        logger.debug("Using cookie name from Spring configuration: {}", jwtConfig.getCookie().getName());
        return jwtConfig.getCookie().getName();
    }

    /**
     * Standard expiration time for dev mode (24 hours)
     */
    public long getDevJwtExpirationMillis() {
        return 24 * 60 * 60 * 1000L; // 24 hours
    }

    @SuppressWarnings("unchecked")
    public boolean isEnrollmentWindowRequired() {
        Map<String, Object> services = (Map<String, Object>) ssotConfig.get("services");
        Map<String, Object> enrollmentService = (Map<String, Object>) services.get("EnrollmentService");
        return (Boolean) enrollmentService.get("enrollmentWindowRequired");
    }

    @SuppressWarnings("unchecked")
    public boolean shouldStudent403IfWindowOff() {
        Map<String, Object> services = (Map<String, Object>) ssotConfig.get("services");
        Map<String, Object> enrollmentService = (Map<String, Object>) services.get("EnrollmentService");
        return (Boolean) enrollmentService.get("student403IfWindowOff");
    }

    @SuppressWarnings("unchecked")
    public String getDefaultAccountType() {
        Map<String, Object> services = (Map<String, Object>) ssotConfig.get("services");
        Map<String, Object> signUpService = (Map<String, Object>) services.get("SignUpService");
        return (String) signUpService.get("defaultAccountType");
    }

    @SuppressWarnings("unchecked")
    public boolean isAdminApprovalRequired() {
        if (services == null) return false;
        Map<String, Object> signUpService = (Map<String, Object>) services.get("SignUpService");
        if (signUpService == null) return false;
        Boolean required = (Boolean) signUpService.get("adminApprovalRequired");
        return required != null && required;
    }

    @SuppressWarnings("unchecked")
    public int getDuplicateUserErrorCode() {
        Map<String, Object> services = (Map<String, Object>) ssotConfig.get("services");
        Map<String, Object> signUpService = (Map<String, Object>) services.get("SignUpService");
        return (Integer) signUpService.get("duplicateUserErrorCode");
    }

    @SuppressWarnings("unchecked")
    public int getDuplicateEnrollmentErrorCode() {
        Map<String, Object> services = (Map<String, Object>) ssotConfig.get("services");
        Map<String, Object> enrollmentService = (Map<String, Object>) services.get("EnrollmentService");
        return (Integer) enrollmentService.get("duplicateEnrollmentErrorCode");
    }

    @SuppressWarnings("unchecked")
    public int getMissingCourseErrorCode() {
        Map<String, Object> services = (Map<String, Object>) ssotConfig.get("services");
        Map<String, Object> enrollmentService = (Map<String, Object>) services.get("EnrollmentService");
        return (Integer) enrollmentService.get("missingCourseErrorCode");
    }

    private long parseTimeToMillis(String timeString) {
        if (timeString == null) return 0;
        timeString = timeString.trim().toLowerCase();
        if (timeString.endsWith("ms")) {
            return Long.parseLong(timeString.replace("ms", ""));
        } else if (timeString.endsWith("s")) {
            return Long.parseLong(timeString.replace("s", "")) * 1000;
        } else if (timeString.endsWith("m")) {
            return Long.parseLong(timeString.replace("m", "")) * 60 * 1000;
        } else if (timeString.endsWith("h")) {
            return Long.parseLong(timeString.replace("h", "")) * 60 * 60 * 1000;
        } else if (timeString.endsWith("d")) {
            return Long.parseLong(timeString.replace("d", "")) * 24 * 60 * 60 * 1000;
        } else {
            return Long.parseLong(timeString);
        }
    }

    /**
     * Resolves environment variables in YAML configuration values.
     * Handles patterns like ${VAR_NAME:?error_message} and ${VAR_NAME:default_value}
     * 
     * @param rawValue The raw configuration value potentially containing environment variable placeholders
     * @return The resolved value with environment variables substituted
     * @throws IllegalStateException if a required environment variable is missing
     */
    private String resolveEnvironmentVariable(String rawValue) {
        if (rawValue == null || !rawValue.contains("${")) {
            return rawValue;
        }

        logger.debug("Resolving environment variable in: {}", rawValue);

        // Pattern: ${VAR_NAME:?error_message} or ${VAR_NAME:default_value}
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\$\\{([^}:]+)(:([?!])([^}]*))?\\}");
        java.util.regex.Matcher matcher = pattern.matcher(rawValue);

        if (matcher.find()) {
            String varName = matcher.group(1);
            String operator = matcher.group(3); // ? or !
            String operand = matcher.group(4);   // error message or default value

            String envValue = System.getenv(varName);
            
            if (envValue == null || envValue.trim().isEmpty()) {
                if ("?".equals(operator)) {
                    // Required variable missing
                    String errorMsg = operand != null ? operand : ("Environment variable " + varName + " is required but not set");
                    logger.error("Missing required environment variable: {} - {}", varName, errorMsg);
                    throw new IllegalStateException("Environment variable " + varName + " is required but not set: " + errorMsg);
                } else if (operand != null) {
                    // Use default value
                    logger.info("Using default value for environment variable {}: {}", varName, operand);
                    return rawValue.replace(matcher.group(0), operand);
                } else {
                    // No default provided, throw error
                    logger.error("Environment variable {} is not set and no default provided", varName);
                    throw new IllegalStateException("Environment variable " + varName + " is not set and no default provided");
                }
            } else {
                logger.info("Resolved environment variable {}: {}", varName, envValue);
                return rawValue.replace(matcher.group(0), envValue);
            }
        }

        return rawValue;
    }
}