package com.cegm.lms.model;

import com.cegm.lms.model.enums.EnrollmentStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "enrollments", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"student_id", "course_id"})
})
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Enrollment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER) // was LAZY
    @JoinColumn(name = "student_id", nullable = false)
    @NotNull
    @JsonIgnoreProperties({ "enrollments", "grades", "password", "hibernateLazyInitializer", "handler" })
    private User student;

    @ManyToOne(fetch = FetchType.EAGER) // was LAZY
    @JoinColumn(name = "course_id", nullable = false)
    @NotNull
    @JsonIgnoreProperties({ "enrollments", "hibernateLazyInitializer", "handler" })
    private Course course;

    @Enumerated(EnumType.STRING) @NotNull
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    @CreationTimestamp
    private LocalDateTime enrolledAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "enrollment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Grade> grades;

    public Enrollment() {}
    public Enrollment(User student, Course course) { this.student = student; this.course = course; }


    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public EnrollmentStatus getStatus() { return status; }
    public void setStatus(EnrollmentStatus status) { this.status = status; }

    public LocalDateTime getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(LocalDateTime enrolledAt) { this.enrolledAt = enrolledAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public List<Grade> getGrades() { return grades; }
    public void setGrades(List<Grade> grades) { this.grades = grades; }
}
