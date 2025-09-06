package com.cegm.lms.exception;

public class CourseNotFoundException extends CegmLmsException {
    public CourseNotFoundException(String message) {
        super(message, "NOT_FOUND");
    }
}
