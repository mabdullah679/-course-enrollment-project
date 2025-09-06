package com.cegm.lms.dto.response;

import com.cegm.lms.model.enums.CourseStatus;

import java.time.LocalDateTime;

public class CourseResponse {
    private Long id;
    private String code;
    private String name;
    private Integer credits;
    private CourseStatus status;
    private String term;
    private LocalDateTime createdAt;
    private Long ownerId;

    // Constructors
    public CourseResponse() {}

    public CourseResponse(Long id, String code, String name, Integer credits, 
                         CourseStatus status, String term, LocalDateTime createdAt, Long ownerId) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.credits = credits;
        this.status = status;
        this.term = term;
        this.createdAt = createdAt;
        this.ownerId = ownerId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }

    public CourseStatus getStatus() { return status; }
    public void setStatus(CourseStatus status) { this.status = status; }

    public String getTerm() { return term; }
    public void setTerm(String term) { this.term = term; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
}