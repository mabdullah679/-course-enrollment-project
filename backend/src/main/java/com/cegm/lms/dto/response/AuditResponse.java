package com.cegm.lms.dto.response;

import java.time.LocalDateTime;

public class AuditResponse {
    private LocalDateTime at;
    private String actor;
    private String action;
    private String from;
    private String to;
    private String note;

    public AuditResponse() {}

    public AuditResponse(LocalDateTime at, String actor, String action, String from, String to, String note) {
        this.at = at;
        this.actor = actor;
        this.action = action;
        this.from = from;
        this.to = to;
        this.note = note;
    }

    // Getters and Setters
    public LocalDateTime getAt() { return at; }
    public void setAt(LocalDateTime at) { this.at = at; }

    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }

    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}