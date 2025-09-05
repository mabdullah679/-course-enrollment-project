package com.cegm.lms.exception;

import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.service.AuditLogService;
import com.cegm.lms.service.SsotConfigService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Autowired
    private SsotConfigService ssotConfigService;

    @Autowired
    private AuditLogService auditLogService;

    @ExceptionHandler(DuplicateUserException.class)
    public ResponseEntity<ApiResponse<Object>> handleDuplicateUser(DuplicateUserException ex) {
        logError("DuplicateUserException", ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(getStudentErrorMessage(), ex.getErrorCode()));
    }

    @ExceptionHandler(DuplicateEnrollmentException.class)
    public ResponseEntity<ApiResponse<Object>> handleDuplicateEnrollment(DuplicateEnrollmentException ex) {
        logError("DuplicateEnrollmentException", ex);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(getStudentErrorMessage(), ex.getErrorCode()));
    }

    @ExceptionHandler(CourseNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleCourseNotFound(CourseNotFoundException ex) {
        logError("CourseNotFoundException", ex);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(getStudentErrorMessage(), ex.getErrorCode()));
    }

    @ExceptionHandler(EnrollmentNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleEnrollmentNotFound(EnrollmentNotFoundException ex) {
        logError("EnrollmentNotFoundException", ex);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(getStudentErrorMessage(), ex.getErrorCode()));
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserNotFound(UserNotFoundException ex) {
        logError("UserNotFoundException", ex);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(getStudentErrorMessage(), ex.getErrorCode()));
    }

    @ExceptionHandler(GradeNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleGradeNotFound(GradeNotFoundException ex) {
        logError("GradeNotFoundException", ex);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(getStudentErrorMessage(), ex.getErrorCode()));
    }

    @ExceptionHandler(EnrollmentWindowClosedException.class)
    public ResponseEntity<ApiResponse<Object>> handleEnrollmentWindowClosed(EnrollmentWindowClosedException ex) {
        logError("EnrollmentWindowClosedException", ex);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(getStudentErrorMessage(), ex.getErrorCode()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Object>> handleUnauthorized(UnauthorizedException ex) {
        logError("UnauthorizedException", ex);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(getStudentErrorMessage(), ex.getErrorCode()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Object>> handleForbidden(ForbiddenException ex) {
        logError("ForbiddenException", ex);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(getStudentErrorMessage(), ex.getErrorCode()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        logError("AccessDeniedException", ex);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(getStudentErrorMessage(), "403"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String requestId = getRequestId();
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> errors = new HashMap<>();
        
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            
            Map<String, Object> fieldError = new HashMap<>();
            fieldError.put("code", "VALIDATION_ERROR");
            fieldError.put("field", fieldName);
            fieldError.put("message", errorMessage);
            
            errors.put(fieldName, fieldError);
        });
        
        response.put("success", false);
        response.put("message", "Validation failed");
        response.put("errors", errors);
        if (requestId != null) {
            response.put("requestId", requestId);
        }
        
        logger.error("Validation error [Request-ID: {}]: {}", requestId, errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        String requestId = getRequestId();
        logError("UnhandledException", ex);
        
        ApiResponse<Object> response = ApiResponse.error(getStudentErrorMessage(), "500");
        if (requestId != null) {
            // Add requestId to response for support tracking
            Map<String, Object> data = new HashMap<>();
            data.put("requestId", requestId);
            response.setData(data);
        }
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    private String getRequestId() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                return (String) request.getAttribute("X-Request-Id");
            }
        } catch (Exception e) {
            // Ignore if we can't get request ID
        }
        return null;
    }

    private void logError(String exceptionType, Exception ex) {
        logger.error("{}: {}", exceptionType, ex.getMessage(), ex);
        
        try {
            // Create audit log for error tracking
            auditLogService.logError(null, "GlobalErrorHandlingService", exceptionType, ex.getMessage());
        } catch (Exception e) {
            logger.error("Failed to create audit log for error", e);
        }
    }

    private String getStudentErrorMessage() {
        try {
            return ssotConfigService.getStudentErrorMessage();
        } catch (Exception e) {
            return "Contact admin for assistance.";
        }
    }
}
