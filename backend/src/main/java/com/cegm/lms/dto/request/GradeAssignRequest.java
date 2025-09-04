package com.cegm.lms.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class GradeAssignRequest {
    @NotNull
    private Long enrollmentId;

    @NotBlank
    private String assignmentName;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "100.0", inclusive = true)
    private BigDecimal score;

    private String feedback;

    // Constructors
    public GradeAssignRequest() {}

    public GradeAssignRequest(Long enrollmentId, String assignmentName, BigDecimal score, String feedback) {
        this.enrollmentId = enrollmentId;
        this.assignmentName = assignmentName;
        this.score = score;
        this.feedback = feedback;
    }

    // Getters and Setters
    public Long getEnrollmentId() { return enrollmentId; }
    public void setEnrollmentId(Long enrollmentId) { this.enrollmentId = enrollmentId; }

    public String getAssignmentName() { return assignmentName; }
    public void setAssignmentName(String assignmentName) { this.assignmentName = assignmentName; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
}
