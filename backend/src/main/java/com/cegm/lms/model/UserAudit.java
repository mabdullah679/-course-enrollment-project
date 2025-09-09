package com.cegm.lms.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_audit")
public class UserAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id", nullable=false)
    private User user;

    @Column(nullable=false)
    private String action; // e.g., APPROVED, ROLE_CHANGED, STATUS_CHANGED

    @Column(length=2000)
    private String details;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public UserAudit() {}
    public UserAudit(User user, String action, String details) {
        this.user = user; this.action = action; this.details = details;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
