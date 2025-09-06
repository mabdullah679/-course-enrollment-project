package com.cegm.lms.service;

import com.cegm.lms.repository.CourseRepository;
import com.cegm.lms.repository.EnrollmentRepository;
import com.cegm.lms.repository.GradeRepository;
import com.cegm.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class MetricsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private GradeRepository gradeRepository;

    public long getUsersCount() {
        return userRepository.count();
    }

    public long getCoursesCount() {
        return courseRepository.count();
    }

    public long getEnrollmentsCount() {
        return enrollmentRepository.count();
    }

    public long getGradesCount() {
        return gradeRepository.count();
    }

    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        metrics.put("users", Map.of(
            "total", getUsersCount(),
            "pending", userRepository.countByApprovedFalse(),
            "active", userRepository.countByActiveTrue()
        ));
        
        metrics.put("courses", Map.of(
            "total", getCoursesCount(),
            "active", courseRepository.countByStatus("ACTIVE")
        ));
        
        metrics.put("enrollments", Map.of(
            "total", getEnrollmentsCount(),
            "active", enrollmentRepository.countByStatus("ACTIVE")
        ));
        
        metrics.put("grades", Map.of(
            "total", getGradesCount()
        ));
        
        return metrics;
    }
}