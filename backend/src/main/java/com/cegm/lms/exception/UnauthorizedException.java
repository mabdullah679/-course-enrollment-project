package com.cegm.lms.exception;

public class UnauthorizedException extends CegmLmsException {
    public UnauthorizedException(String message) {
        super(message, "PERMISSION_DENIED");
    }
}
