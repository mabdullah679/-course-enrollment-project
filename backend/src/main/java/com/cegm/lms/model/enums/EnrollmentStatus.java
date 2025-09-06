package com.cegm.lms.model.enums;

/**
 * Enrollment status enum implementing the SSoT state machine:
 * PENDING -> APPROVED -> ACTIVE -> COMPLETED
 * PENDING -> REJECTED
 */
public enum EnrollmentStatus {
    PENDING, APPROVED, ACTIVE, COMPLETED, REJECTED
}
