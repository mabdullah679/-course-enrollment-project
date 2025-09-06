package com.cegm.lms.service;

import com.cegm.lms.exception.DuplicateEnrollmentException;
import com.cegm.lms.exception.CourseNotFoundException;
import com.cegm.lms.exception.EnrollmentNotFoundException;
import com.cegm.lms.exception.UserNotFoundException;
import com.cegm.lms.model.Course;
import com.cegm.lms.model.Enrollment;
import com.cegm.lms.model.User;
import com.cegm.lms.model.enums.EnrollmentStatus;
import com.cegm.lms.repository.CourseRepository;
import com.cegm.lms.repository.EnrollmentRepository;
import com.cegm.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service for managing enrollments with SSoT compliance.
 * Implements state machine validation and enrollment policies.
 */
@Service
@Transactional
public class EnrollmentService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private SsotConfigService ssotConfigService;

    /**
     * Create new enrollment with policy validation.
     */
    public Enrollment createEnrollment(Long studentId, Long courseId) {
        User student = userRepository.findById(studentId)
            .orElseThrow(() -> new UserNotFoundException("Student not found"));
        
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new CourseNotFoundException("Course not found"));

        // Check for duplicate enrollment
        if (ssotConfigService.getDuplicateEnrollmentErrorCode() == 409 &&
            enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new DuplicateEnrollmentException("Student already enrolled in this course");
        }

        Enrollment enrollment = new Enrollment(student, course);
        enrollment.setStatus(EnrollmentStatus.PENDING); // Start with PENDING status
        
        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);
        
        auditLogService.log(studentId, "EnrollmentService", "ENROLLMENT_CREATED", 
            String.format("Student %s enrolled in course %s", student.getUsername(), course.getCode()));
        
        return savedEnrollment;
    }

    /**
     * Update enrollment status with state machine validation.
     */
    public Enrollment updateEnrollmentStatus(Long enrollmentId, EnrollmentStatus newStatus) {
        Enrollment enrollment = findById(enrollmentId);
        EnrollmentStatus currentStatus = enrollment.getStatus();
        
        // Validate state transitions according to SSoT FSM
        if (!isValidTransition(currentStatus, newStatus)) {
            throw new IllegalStateException(
                String.format("Invalid transition from %s to %s", currentStatus, newStatus));
        }
        
        enrollment.setStatus(newStatus);
        
        // Set completion timestamp if completed
        if (newStatus == EnrollmentStatus.COMPLETED) {
            enrollment.setCompletedAt(LocalDateTime.now());
        }
        
        Enrollment updatedEnrollment = enrollmentRepository.save(enrollment);
        
        auditLogService.log(enrollment.getStudent().getId(), "EnrollmentService", "STATUS_UPDATED",
            String.format("Enrollment %d status changed from %s to %s", enrollmentId, currentStatus, newStatus));
        
        return updatedEnrollment;
    }

    /**
     * Validate enrollment state transitions per SSoT FSM.
     */
    private boolean isValidTransition(EnrollmentStatus from, EnrollmentStatus to) {
        switch (from) {
            case PENDING:
                return to == EnrollmentStatus.APPROVED || to == EnrollmentStatus.REJECTED;
            case APPROVED:
                return to == EnrollmentStatus.ACTIVE;
            case ACTIVE:
                return to == EnrollmentStatus.COMPLETED;
            case COMPLETED:
            case REJECTED:
                return false; // Terminal states
            default:
                return false;
        }
    }

    /**
     * Check if enrollment belongs to a specific student (for authorization).
     */
    public boolean isStudentEnrollment(Long enrollmentId, Long studentId) {
        return enrollmentRepository.findById(enrollmentId)
            .map(enrollment -> enrollment.getStudent().getId().equals(studentId))
            .orElse(false);
    }

    // Finder methods
    public Enrollment findById(Long id) {
        return enrollmentRepository.findById(id)
            .orElseThrow(() -> new EnrollmentNotFoundException("Enrollment not found"));
    }

    public Page<Enrollment> getAllEnrollments(Pageable pageable) {
        return enrollmentRepository.findAll(pageable);
    }

    public Page<Enrollment> getEnrollmentsByStatus(EnrollmentStatus status, Pageable pageable) {
        return enrollmentRepository.findByStatus(status, pageable);
    }

    public Page<Enrollment> getEnrollmentsByStudent(Long studentId, Pageable pageable) {
        return enrollmentRepository.findByStudentId(studentId, pageable);
    }

    public Page<Enrollment> getEnrollmentsByCourse(Long courseId, Pageable pageable) {
        return enrollmentRepository.findByCourseId(courseId, pageable);
    }

    /**
     * Get available enrollments - courses with open enrollment.
     * This is a placeholder implementation.
     */
    public Page<Enrollment> getAvailableEnrollments(Pageable pageable) {
        // For now, return all active enrollments
        // TODO: Implement based on enrollment window status and course availability
        return enrollmentRepository.findByStatus(EnrollmentStatus.ACTIVE, pageable);
    }

    /**
     * Get unavailable enrollments - courses with closed enrollment or archived.
     * This is a placeholder implementation.
     */
    public Page<Enrollment> getUnavailableEnrollments(Pageable pageable) {
        // For now, return rejected and dropped enrollments
        // TODO: Implement based on enrollment window status and course status
        return enrollmentRepository.findAll(pageable); // Placeholder
    }
}
