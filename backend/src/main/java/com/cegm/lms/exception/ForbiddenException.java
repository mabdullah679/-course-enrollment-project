package com.cegm.lms.exception;

public class ForbiddenException extends CegmLmsException {
    public ForbiddenException(String message) {
        super(message, "PERMISSION_DENIED");
    }
}
