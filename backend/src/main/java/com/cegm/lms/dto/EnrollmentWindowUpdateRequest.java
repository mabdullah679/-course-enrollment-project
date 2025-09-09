package com.cegm.lms.dto;

import jakarta.validation.constraints.NotNull;

public class EnrollmentWindowUpdateRequest {
    @NotNull
    private String status; // Accepts "ON" | "OFF" | "OPEN" | "CLOSED"
    private String term;   // optional
    private String startDate; // optional ISO date string or MM/dd/yyyy
    private String endDate;   // optional ISO date string or MM/dd/yyyy

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTerm() { return term; }
    public void setTerm(String term) { this.term = term; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
}
