package com.cegm.lms.service;

import com.cegm.lms.model.EnrollmentWindow;
import com.cegm.lms.model.enums.EnrollmentWindowStatus;
import com.cegm.lms.repository.EnrollmentWindowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
public class EnrollmentWindowService {
    
    @Autowired
    private EnrollmentWindowRepository enrollmentWindowRepository;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MM/dd/yyyy");
    private static final ZoneId EST_ZONE = ZoneId.of("America/New_York");

    public synchronized Map<String,Object> updateEnrollmentWindow(String status, String term, String startDate, String endDate) {
        EnrollmentWindow window = getCurrentOrCreateWindow();
        
        // Normalize status from string to enum
        if (status != null) {
            EnrollmentWindowStatus windowStatus = EnrollmentWindowStatus.fromString(status);
            window.setStatus(windowStatus);
        }
        
        window.setTerm(term != null ? term : "");
        
        if (startDate != null) {
            window.setStartDate(parseDate(startDate));
        }
        
        if (endDate != null) {
            window.setEndDate(parseDate(endDate));
        }
        
        enrollmentWindowRepository.save(window);
        return getEnrollmentWindowStatus();
    }
    
    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return LocalDate.now(EST_ZONE);
        }
        
        // Try MM/dd/yyyy format first
        if (dateStr.matches("\\d{2}/\\d{2}/\\d{4}")) {
            return LocalDate.parse(dateStr, DATE_FORMATTER);
        }
        
        // Fall back to ISO format (yyyy-mm-dd)
        return LocalDate.parse(dateStr);
    }

    public Map<String,Object> getEnrollmentWindowStatus() {
        EnrollmentWindow window = getCurrentOrCreateWindow();
        
        // Get today's date in EST for frontend display
        LocalDate todayEST = LocalDate.now(EST_ZONE);
        
        return Map.of(
            "state", window.getStatus().toStandardString(), // Use OPEN/CLOSED format
            "status", window.getStatus().toLegacyString(), // Keep legacy ON/OFF for compatibility
            "term", window.getTerm() != null ? window.getTerm() : "",
            "startDate", window.getStartDate() != null ? window.getStartDate().format(DATE_FORMATTER) : todayEST.format(DATE_FORMATTER),
            "endDate", window.getEndDate() != null ? window.getEndDate().format(DATE_FORMATTER) : todayEST.format(DATE_FORMATTER),
            "window_open_date_est", window.getStartDate() != null ? window.getStartDate().format(DATE_FORMATTER) : todayEST.format(DATE_FORMATTER),
            "window_close_date_est", window.getEndDate() != null ? window.getEndDate().format(DATE_FORMATTER) : todayEST.format(DATE_FORMATTER),
            "today_date_est", todayEST.format(DATE_FORMATTER)
        );
    }
    
    private EnrollmentWindow getCurrentOrCreateWindow() {
        return enrollmentWindowRepository.findAll()
            .stream()
            .findFirst()
            .orElseGet(() -> {
                EnrollmentWindow defaultWindow = EnrollmentWindow.createWithDefaults();
                return enrollmentWindowRepository.save(defaultWindow);
            });
    }
}
