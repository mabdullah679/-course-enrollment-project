package com.cegm.lms.controller;

import com.cegm.lms.repository.CourseRepository;
import com.cegm.lms.repository.EnrollmentRepository;
import com.cegm.lms.repository.GradeRepository;
import com.cegm.lms.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/metrics")
public class MetricsController {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final GradeRepository gradeRepository;

    public MetricsController(UserRepository users, CourseRepository courses,
                             EnrollmentRepository enrollments, GradeRepository grades) {
        this.userRepository = users;
        this.courseRepository = courses;
        this.enrollmentRepository = enrollments;
        this.gradeRepository = grades;
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Long>> users() {
        return ResponseEntity.ok(Map.of("count", userRepository.count()));
    }

    @GetMapping("/courses")
    public ResponseEntity<Map<String, Long>> courses() {
        return ResponseEntity.ok(Map.of("count", courseRepository.count()));
    }

    @GetMapping("/enrollments")
    public ResponseEntity<Map<String, Long>> enrollments() {
        return ResponseEntity.ok(Map.of("count", enrollmentRepository.count()));
    }

    @GetMapping("/grades")
    public ResponseEntity<Map<String, Long>> grades() {
        return ResponseEntity.ok(Map.of("count", gradeRepository.count()));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Long>> dashboard() {
        return ResponseEntity.ok(Map.of(
            "users", userRepository.count(),
            "courses", courseRepository.count(),
            "enrollments", enrollmentRepository.count(),
            "grades", gradeRepository.count()
        ));
    }
}
