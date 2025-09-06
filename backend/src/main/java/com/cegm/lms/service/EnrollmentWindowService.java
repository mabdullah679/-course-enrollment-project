package com.cegm.lms.service;

import com.cegm.lms.model.EnrollmentWindow;
import com.cegm.lms.model.enums.EnrollmentWindowStatus;
import com.cegm.lms.repository.EnrollmentWindowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class EnrollmentWindowService {

    @Autowired
    private EnrollmentWindowRepository enrollmentWindowRepository;

    public Map<String, Object> getEnrollmentWindowStatus() {
        EnrollmentWindow window = enrollmentWindowRepository.findTopByOrderByCreatedAtDesc()
            .orElseGet(this::createDefaultWindow);
        
        Map<String, Object> status = new HashMap<>();
        status.put("state", window.getStatus().name());
        status.put("isOpen", window.getStatus() == EnrollmentWindowStatus.ON);
        status.put("lastUpdated", window.getUpdatedAt());
        status.put("updatedBy", window.getUpdatedBy());
        
        return status;
    }

    public Map<String, Object> updateEnrollmentWindow(String state, String term, String startDate, String endDate) {
        EnrollmentWindow window = enrollmentWindowRepository.findTopByOrderByCreatedAtDesc()
            .orElseGet(this::createDefaultWindow);
        
        // Update state
        if (state != null) {
            try {
                EnrollmentWindowStatus status = EnrollmentWindowStatus.valueOf(state.toUpperCase());
                window.setStatus(status);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid enrollment window state: " + state);
            }
        }
        
        // Set updated by to current user (for now using system - would normally get from security context)
        window.setUpdatedBy("admin"); // TODO: Get from security context
        window.setUpdatedAt(LocalDateTime.now());
        
        enrollmentWindowRepository.save(window);
        
        // Return updated status
        return getEnrollmentWindowStatus();
    }

    private EnrollmentWindow createDefaultWindow() {
        EnrollmentWindow window = new EnrollmentWindow();
        window.setStatus(EnrollmentWindowStatus.ON);
        window.setUpdatedBy("system");
        window.setCreatedAt(LocalDateTime.now());
        return enrollmentWindowRepository.save(window);
    }

    public boolean isEnrollmentOpen() {
        EnrollmentWindow window = enrollmentWindowRepository.findTopByOrderByCreatedAtDesc()
            .orElseGet(this::createDefaultWindow);
        return window.getStatus() == EnrollmentWindowStatus.ON;
    }
}