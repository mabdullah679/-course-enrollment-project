package com.cegm.lms.service;

import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class EnrollmentWindowService {
    private volatile String status = "OFF";
    private volatile String term = null;
    private volatile String startDate = null;
    private volatile String endDate = null;

    public synchronized Map<String,Object> updateEnrollmentWindow(String status, String term, String startDate, String endDate) {
        if (status != null) this.status = status;
        this.term = term;
        this.startDate = startDate;
        this.endDate = endDate;
        return getEnrollmentWindowStatus();
    }

    public Map<String,Object> getEnrollmentWindowStatus() {
        return Map.of(
            "status", status,
            "term", term,
            "startDate", startDate,
            "endDate", endDate
        );
    }
}
