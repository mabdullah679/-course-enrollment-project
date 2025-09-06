package com.cegm.lms.exception;

import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.dto.response.ErrorResponse;
import com.cegm.lms.service.AuditLogService;
import com.cegm.lms.service.SsotConfigService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
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
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Autowired
    private SsotConfigService ssotConfigService;

    @Autowired
    private AuditLogService auditLogService;

    @ExceptionHandler(DuplicateUserException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateUser(DuplicateUserException ex) {
        logError("DuplicateUserException", ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.duplicateResource(ex.getMessage()));
    }

    @ExceptionHandler(DuplicateEnrollmentException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEnrollment(DuplicateEnrollmentException ex) {
        logError("DuplicateEnrollmentException", ex);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.alreadyEnrolled(ex.getMessage()));
    }

    @ExceptionHandler(CourseNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCourseNotFound(CourseNotFoundException ex) {
        logError("CourseNotFoundException", ex);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.notFound(ex.getMessage()));
    }

    @ExceptionHandler(EnrollmentNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEnrollmentNotFound(EnrollmentNotFoundException ex) {
        logError("EnrollmentNotFoundException", ex);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.notFound(ex.getMessage()));
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
        logError("UserNotFoundException", ex);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.notFound(ex.getMessage()));
    }

    @ExceptionHandler(InvalidTransitionException.class)
    public ResponseEntity<ErrorResponse> handleInvalidTransition(InvalidTransitionException ex) {
        logError("InvalidTransitionException", ex);
        String requestId = UUID.randomUUID().toString();
        ErrorResponse error = new ErrorResponse("INVALID_TRANSITION", ex.getMessage());
        error.setRequestId(requestId);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(error);
    }

    @ExceptionHandler(GradeNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleGradeNotFound(GradeNotFoundException ex) {
        logError("GradeNotFoundException", ex);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.notFound(ex.getMessage()));
    }

    @ExceptionHandler(EnrollmentWindowClosedException.class)
    public ResponseEntity<ErrorResponse> handleEnrollmentWindowClosed(EnrollmentWindowClosedException ex) {
        logError("EnrollmentWindowClosedException", ex);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.enrollmentWindowClosed(ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
        logError("UnauthorizedException", ex);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.permissionDenied(ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException ex) {
        logError("ForbiddenException", ex);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.permissionDenied(ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        logError("AccessDeniedException", ex);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.permissionDenied("Access denied"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String requestId = getOrCreateRequestId();
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
        
        try {
            auditLogService.logError(null, "ValidationService", "VALIDATION_ERROR", 
                "Field validation failed: " + errors.keySet());
        } catch (Exception e) {
            logger.error("Failed to create audit log for validation error", e);
        }
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        String requestId = getOrCreateRequestId();
        logError("UnhandledException", ex);
        
        ErrorResponse errorResponse = ErrorResponse.serverError(
            "An unexpected error occurred. Please contact support.", 
            requestId
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    private String getOrCreateRequestId() {
        try {
            // Try to get from MDC first
            String requestId = MDC.get("requestId");
            if (requestId != null) {
                return requestId;
            }
            
            // Try to get from request attributes
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                requestId = (String) request.getAttribute("X-Request-Id");
                if (requestId != null) {
                    return requestId;
                }
                
                // Generate new request ID if none exists
                requestId = UUID.randomUUID().toString();
                request.setAttribute("X-Request-Id", requestId);
                MDC.put("requestId", requestId);
                return requestId;
            }
        } catch (Exception e) {
            // Ignore if we can't get/create request ID
        }
        return UUID.randomUUID().toString();
    }

    private void logError(String exceptionType, Exception ex) {
        String requestId = getOrCreateRequestId();
        logger.error("{} [Request-ID: {}]: {}", exceptionType, requestId, ex.getMessage(), ex);
        
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
