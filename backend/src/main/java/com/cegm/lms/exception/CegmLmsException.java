package com.cegm.lms.exception;

public class CegmLmsException extends RuntimeException {
    private final String errorCode;

    public CegmLmsException(String message) {
        super(message);
        this.errorCode = null;
    }

    public CegmLmsException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public CegmLmsException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = null;
    }

    public CegmLmsException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
