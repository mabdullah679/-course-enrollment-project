package com.cegm.lms.model.enums;

public enum EnrollmentWindowStatus {
    ON, OFF, OPEN, CLOSED;

    // Helper method to normalize different status representations
    public static EnrollmentWindowStatus fromString(String status) {
        if (status == null) return CLOSED;
        
        String upperStatus = status.toUpperCase();
        switch (upperStatus) {
            case "ON":
            case "OPEN":
                return OPEN;
            case "OFF":
            case "CLOSED":
                return CLOSED;
            default:
                return CLOSED; // Default to closed for safety
        }
    }

    // Convert to standardized string representation
    public String toStandardString() {
        switch (this) {
            case ON:
            case OPEN:
                return "OPEN";
            case OFF:
            case CLOSED:
                return "CLOSED";
            default:
                return "CLOSED";
        }
    }

    // For backwards compatibility with existing API
    public String toLegacyString() {
        switch (this) {
            case ON:
            case OPEN:
                return "ON";
            case OFF:
            case CLOSED:
                return "OFF";
            default:
                return "OFF";
        }
    }
}
