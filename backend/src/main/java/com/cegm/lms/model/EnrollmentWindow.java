package com.cegm.lms.model;

import com.cegm.lms.model.enums.EnrollmentWindowStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "enrollment_window")
public class EnrollmentWindow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @NotNull
    private EnrollmentWindowStatus status = EnrollmentWindowStatus.CLOSED; // Default to CLOSED per requirements

    @Column(name = "term")
    private String term;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private String updatedBy;

    // Constructors
    public EnrollmentWindow() {}

    public EnrollmentWindow(EnrollmentWindowStatus status) {
        this.status = status;
    }

    // Helper method to get defaults
    public static EnrollmentWindow createWithDefaults() {
        EnrollmentWindow window = new EnrollmentWindow();
        window.setStatus(EnrollmentWindowStatus.CLOSED);
        window.setStartDate(LocalDate.now());
        window.setEndDate(LocalDate.now());
        window.setTerm("");
        return window;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public EnrollmentWindowStatus getStatus() { return status; }
    public void setStatus(EnrollmentWindowStatus status) { this.status = status; }

    public String getTerm() { return term; }
    public void setTerm(String term) { this.term = term; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
