package com.cegm.lms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CourseCreateRequest {
    @NotBlank
    private String code;

    @NotBlank
    private String name;

    private String description;

    @NotNull
    private Integer credits;

    // Constructors
    public CourseCreateRequest() {}

    public CourseCreateRequest(String code, String name, String description, Integer credits) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.credits = credits;
    }

    // Getters and Setters
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }
}
