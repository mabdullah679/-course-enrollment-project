package com.cegm.lms.event;

import org.springframework.context.ApplicationEvent;

/**
 * Event emitted when an enrollment is rejected.
 * This is a minimal scaffold for future notification implementations.
 */
public class EnrollmentRejectedEvent extends ApplicationEvent {
    private final Long enrollmentId;
    private final Long studentId;
    private final Long courseId;
    private final String courseName;
    private final String studentName;

    public EnrollmentRejectedEvent(Object source, Long enrollmentId, Long studentId, Long courseId, String courseName, String studentName) {
        super(source);
        this.enrollmentId = enrollmentId;
        this.studentId = studentId;
        this.courseId = courseId;
        this.courseName = courseName;
        this.studentName = studentName;
    }

    public Long getEnrollmentId() { return enrollmentId; }
    public Long getStudentId() { return studentId; }
    public Long getCourseId() { return courseId; }
    public String getCourseName() { return courseName; }
    public String getStudentName() { return studentName; }
}