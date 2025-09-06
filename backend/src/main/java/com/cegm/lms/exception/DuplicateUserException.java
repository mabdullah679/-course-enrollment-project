package com.cegm.lms.exception;

public class DuplicateUserException extends CegmLmsException {
    public DuplicateUserException(String message) {
        super(message, "DUPLICATE_RESOURCE");
    }
}
