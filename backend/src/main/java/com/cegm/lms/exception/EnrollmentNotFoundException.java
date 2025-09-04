package com.cegm.lms.exception;

public class EnrollmentNotFoundException extends CegmLmsException {
    public EnrollmentNotFoundException(String message) {
        super(message, "404");
    }
}
