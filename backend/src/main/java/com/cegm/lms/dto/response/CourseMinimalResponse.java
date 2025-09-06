package com.cegm.lms.dto.response;

public class CourseMinimalResponse {
    private Long id;
    private String code;
    private String name;

    public CourseMinimalResponse() {}

    public CourseMinimalResponse(Long id, String code, String name) {
        this.id = id;
        this.code = code;
        this.name = name;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}