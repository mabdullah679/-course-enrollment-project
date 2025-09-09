package com.cegm.lms.model.enums;

public enum CourseStatus {
    ACTIVE, ARCHIVED, DRAFT, CLOSED;

    // Helper method to get all available statuses
    public static CourseStatus[] getAvailableStatuses() {
        return new CourseStatus[]{ACTIVE, ARCHIVED, DRAFT};
    }

    // Convert from string with normalization
    public static CourseStatus fromString(String status) {
        if (status == null) return DRAFT;
        
        try {
            return CourseStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return DRAFT; // Default to draft for unknown values
        }
    }

    // Check if status allows enrollment
    public boolean allowsEnrollment() {
        return this == ACTIVE;
    }

    // Check if status is terminal (no further changes allowed)
    public boolean isTerminal() {
        return this == ARCHIVED || this == CLOSED;
    }

    // Get display label for UI
    public String getDisplayLabel() {
        switch (this) {
            case ACTIVE:
                return "Active";
            case ARCHIVED:
                return "Archived";
            case DRAFT:
                return "Draft";
            case CLOSED:
                return "Closed";
            default:
                return this.toString();
        }
    }
}
