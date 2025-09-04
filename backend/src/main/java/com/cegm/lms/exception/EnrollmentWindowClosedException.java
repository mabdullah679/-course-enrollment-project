package com.cegm.lms.exception;

public class EnrollmentWindowClosedException extends CegmLmsException {
    public EnrollmentWindowClosedException(String message) {
        super(message, "403");
    }
}
