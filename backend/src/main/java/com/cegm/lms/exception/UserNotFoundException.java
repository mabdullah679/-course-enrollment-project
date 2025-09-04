package com.cegm.lms.exception;

public class UserNotFoundException extends CegmLmsException {
    public UserNotFoundException(String message) {
        super(message, "404");
    }
}
