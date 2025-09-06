package com.cegm.lms.dto.response;

/**
 * Standardized error response following the pattern: {code, field?, message}
 * Used for 400-level client errors with consistent structure
 */
public class ErrorResponse {
    private String code;
    private String field;  // Optional - only present for field-specific validation errors
    private String message;
    private String requestId; // Optional - only present for 5xx server errors

    // Constructors
    public ErrorResponse() {}

    public ErrorResponse(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public ErrorResponse(String code, String field, String message) {
        this.code = code;
        this.field = field;
        this.message = message;
    }

    // Static factory methods
    public static ErrorResponse validation(String message) {
        return new ErrorResponse("VALIDATION_ERROR", message);
    }

    public static ErrorResponse validation(String field, String message) {
        return new ErrorResponse("VALIDATION_ERROR", field, message);
    }

    public static ErrorResponse duplicateResource(String message) {
        return new ErrorResponse("DUPLICATE_RESOURCE", message);
    }

    public static ErrorResponse notFound(String message) {
        return new ErrorResponse("NOT_FOUND", message);
    }

    public static ErrorResponse enrollmentWindowClosed(String message) {
        return new ErrorResponse("ENROLLMENT_WINDOW_CLOSED", message);
    }

    public static ErrorResponse alreadyEnrolled(String message) {
        return new ErrorResponse("ALREADY_ENROLLED", message);
    }

    public static ErrorResponse permissionDenied(String message) {
        return new ErrorResponse("PERMISSION_DENIED", message);
    }

    public static ErrorResponse serverError(String message, String requestId) {
        ErrorResponse error = new ErrorResponse("SERVER_ERROR", message);
        error.setRequestId(requestId);
        return error;
    }

    // Getters and Setters
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getField() { return field; }
    public void setField(String field) { this.field = field; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }
}