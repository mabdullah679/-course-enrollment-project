package com.cegm.lms.exception;

public class DuplicateEnrollmentException extends CegmLmsException {
    public DuplicateEnrollmentException(String message) {
        super(message, "ALREADY_ENROLLED");
    }
}
