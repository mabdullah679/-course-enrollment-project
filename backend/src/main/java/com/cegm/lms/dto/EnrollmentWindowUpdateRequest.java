package com.cegm.lms.dto;

import jakarta.validation.constraints.NotNull;

public class EnrollmentWindowUpdateRequest {
    @NotNull
    private String status; // "ON" | "OFF"
    private String term;   // optional
    private String startDate; // optional ISO date string
    private String endDate;   // optional ISO date string

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTerm() { return term; }
    public void setTerm(String term) { this.term = term; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
}
