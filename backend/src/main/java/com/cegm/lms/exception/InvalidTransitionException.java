package com.cegm.lms.exception;

public class InvalidTransitionException extends CegmLmsException {
    public InvalidTransitionException(String message) {
        super(message);
    }

    @Override
    public String getErrorCode() {
        return "INVALID_TRANSITION";
    }
}