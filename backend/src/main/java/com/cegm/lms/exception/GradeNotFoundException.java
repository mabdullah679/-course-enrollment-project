package com.cegm.lms.exception;

public class GradeNotFoundException extends CegmLmsException {
    public GradeNotFoundException(String message) {
        super(message, "404");
    }
}
