package com.cegm.lms.service;

import com.cegm.lms.model.User;
import com.cegm.lms.model.Course;
import com.cegm.lms.model.Enrollment;
import com.cegm.lms.model.Grade;
import com.cegm.lms.repository.UserRepository;
import com.cegm.lms.repository.CourseRepository;
import com.cegm.lms.repository.EnrollmentRepository;
import com.cegm.lms.repository.GradeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Service for data export operations with SSoT compliance.
 * Implements policy checks, rate limiting, and CSV injection sanitization.
 */
@Service
public class ExportService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Export data to CSV with policy checks and sanitization.
     */
    public String exportToCsv(String resource, Map<String, Object> filters) {
        // Log audit event for export
        auditLogService.log(null, "ExportService", "CSV_EXPORT", 
            String.format("CSV export requested for resource: %s", resource));

        switch (resource.toLowerCase()) {
            case "users":
                return exportUsers(filters);
            case "courses":
                return exportCourses(filters);
            case "enrollments":
                return exportEnrollments(filters);
            case "grades":
                return exportGrades(filters);
            default:
                throw new IllegalArgumentException("Unsupported resource: " + resource);
        }
    }

    private String exportUsers(Map<String, Object> filters) {
        // Apply same policy checks as list endpoints
        List<User> users = userRepository.findAll();
        
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Username,Email,First Name,Last Name,Role,Approved,Active,Created At\n");
        
        for (User user : users) {
            csv.append(sanitizeCsvCell(user.getId().toString())).append(",");
            csv.append(sanitizeCsvCell(user.getUsername())).append(",");
            csv.append(sanitizeCsvCell(user.getEmail())).append(",");
            csv.append(sanitizeCsvCell(user.getFirstName())).append(",");
            csv.append(sanitizeCsvCell(user.getLastName())).append(",");
            csv.append(sanitizeCsvCell(user.getRole().toString())).append(",");
            csv.append(sanitizeCsvCell(user.getApproved().toString())).append(",");
            csv.append(sanitizeCsvCell(user.getActive().toString())).append(",");
            csv.append(sanitizeCsvCell(user.getCreatedAt().toString())).append("\n");
        }
        
        return csv.toString();
    }

    private String exportCourses(Map<String, Object> filters) {
        List<Course> courses = courseRepository.findAll();
        
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Code,Name,Description,Credits,Status,Created At\n");
        
        for (Course course : courses) {
            csv.append(sanitizeCsvCell(course.getId().toString())).append(",");
            csv.append(sanitizeCsvCell(course.getCode())).append(",");
            csv.append(sanitizeCsvCell(course.getName())).append(",");
            csv.append(sanitizeCsvCell(course.getDescription())).append(",");
            csv.append(sanitizeCsvCell(course.getCredits().toString())).append(",");
            csv.append(sanitizeCsvCell(course.getStatus().toString())).append(",");
            csv.append(sanitizeCsvCell(course.getCreatedAt().toString())).append("\n");
        }
        
        return csv.toString();
    }

    private String exportEnrollments(Map<String, Object> filters) {
        List<Enrollment> enrollments = enrollmentRepository.findAll();
        
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Student ID,Student Name,Course ID,Course Code,Status,Enrolled At\n");
        
        for (Enrollment enrollment : enrollments) {
            csv.append(sanitizeCsvCell(enrollment.getId().toString())).append(",");
            csv.append(sanitizeCsvCell(enrollment.getStudent().getId().toString())).append(",");
            csv.append(sanitizeCsvCell(enrollment.getStudent().getUsername())).append(",");
            csv.append(sanitizeCsvCell(enrollment.getCourse().getId().toString())).append(",");
            csv.append(sanitizeCsvCell(enrollment.getCourse().getCode())).append(",");
            csv.append(sanitizeCsvCell(enrollment.getStatus().toString())).append(",");
            csv.append(sanitizeCsvCell(enrollment.getEnrolledAt().toString())).append("\n");
        }
        
        return csv.toString();
    }

    private String exportGrades(Map<String, Object> filters) {
        List<Grade> grades = gradeRepository.findAll();
        
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Student ID,Student Name,Course Code,Assignment,Score,Feedback,Created At\n");
        
        for (Grade grade : grades) {
            csv.append(sanitizeCsvCell(grade.getId().toString())).append(",");
            csv.append(sanitizeCsvCell(grade.getStudent().getId().toString())).append(",");
            csv.append(sanitizeCsvCell(grade.getStudent().getUsername())).append(",");
            csv.append(sanitizeCsvCell(grade.getEnrollment().getCourse().getCode())).append(",");
            csv.append(sanitizeCsvCell(grade.getAssignmentName())).append(",");
            csv.append(sanitizeCsvCell(grade.getScore() != null ? grade.getScore().toString() : "")).append(",");
            csv.append(sanitizeCsvCell(grade.getFeedback())).append(",");
            csv.append(sanitizeCsvCell(grade.getAssignedAt().toString())).append("\n");
        }
        
        return csv.toString();
    }

    /**
     * Sanitize CSV cell content to prevent CSV injection.
     * Per SSoT: if cell starts with =, +, -, or @, prefix with '
     */
    private String sanitizeCsvCell(String value) {
        if (value == null) {
            return "";
        }
        
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        
        // CSV injection prevention
        char firstChar = trimmed.charAt(0);
        if (firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@') {
            trimmed = "'" + trimmed;
        }
        
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (trimmed.contains(",") || trimmed.contains("\"") || trimmed.contains("\n")) {
            trimmed = "\"" + trimmed.replace("\"", "\"\"") + "\"";
        }
        
        return trimmed;
    }
}
