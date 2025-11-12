package com.cegm.lms.service;

import com.cegm.lms.event.EnrollmentRejectedEvent;
import com.cegm.lms.exception.DuplicateEnrollmentException;
import com.cegm.lms.exception.CourseNotFoundException;
import com.cegm.lms.exception.EnrollmentNotFoundException;
import com.cegm.lms.exception.UnauthorizedException;
import com.cegm.lms.exception.UserNotFoundException;
import com.cegm.lms.model.Course;
import com.cegm.lms.model.Enrollment;
import com.cegm.lms.model.User;
import com.cegm.lms.model.enums.EnrollmentStatus;
import com.cegm.lms.repository.CourseRepository;
import com.cegm.lms.repository.EnrollmentRepository;
import com.cegm.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
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

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private EnrollmentWindowService enrollmentWindowService;

    /**
     * Create new enrollment with policy validation.
     */
    public Enrollment createEnrollment(Long studentId, Long courseId) {
        enrollmentWindowService.assertEnrollmentWindowOpenForStudents();

        User student = userRepository.findById(studentId)
            .orElseThrow(() -> new UserNotFoundException("Student not found"));
        
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new CourseNotFoundException("Course not found"));

        var existingEnrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId);
        if (existingEnrollment.isPresent()) {
            Enrollment current = existingEnrollment.get();
            EnrollmentStatus status = current.getStatus();
            if (status == EnrollmentStatus.REJECTED || status == EnrollmentStatus.DROPPED) {
                current.setStatus(EnrollmentStatus.PENDING);
                current.setCompletedAt(null);
                current.setWithdrawalReason(null);
                current.setWithdrawalRequestedAt(null);
                current.setEnrolledAt(LocalDateTime.now());
                Enrollment saved = enrollmentRepository.save(current);
                auditLogService.log(studentId, "EnrollmentService", "ENROLLMENT_REOPENED",
                    String.format("Student %s re-requested enrollment for course %s", student.getUsername(), course.getCode()));
                return saved;
            }

            if (ssotConfigService.getDuplicateEnrollmentErrorCode() == 409) {
                throw new DuplicateEnrollmentException("Student already enrolled in this course");
            }
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
     * Reject enrollment with notification event emission.
     * Simplified method for rejection flow UX.
     */
    public Enrollment rejectEnrollment(Long enrollmentId) {
        Enrollment enrollment = findById(enrollmentId);
        
        // Use the standard status update method to ensure validation
        Enrollment rejectedEnrollment = updateEnrollmentStatus(enrollmentId, EnrollmentStatus.REJECTED);
        
        // Emit rejection event for notification system
        eventPublisher.publishEvent(new EnrollmentRejectedEvent(
            this,
            rejectedEnrollment.getId(),
            rejectedEnrollment.getStudent().getId(),
            rejectedEnrollment.getCourse().getId(),
            rejectedEnrollment.getCourse().getName(),
            rejectedEnrollment.getStudent().getFirstName() + " " + rejectedEnrollment.getStudent().getLastName()
        ));
        
        return rejectedEnrollment;
    }

    public void deleteEnrollment(Long enrollmentId, Long studentId) {
        Enrollment enrollment = findById(enrollmentId);
        if (!enrollment.getStudent().getId().equals(studentId)) {
            throw new UnauthorizedException("Cannot modify this enrollment");
        }
        if (enrollment.getStatus() == EnrollmentStatus.PENDING || enrollment.getStatus() == EnrollmentStatus.REJECTED ||
                enrollment.getStatus() == EnrollmentStatus.DROPPED) {
            enrollmentRepository.delete(enrollment);
            auditLogService.log(studentId, "EnrollmentService", "ENROLLMENT_DELETED",
                String.format("Enrollment %d removed by student", enrollmentId));
        } else {
            throw new IllegalStateException("Only pending, rejected, or dropped enrollments can be removed");
        }
    }

    public Enrollment withdrawEnrollment(Long enrollmentId, Long studentId, String reason) {
        Enrollment enrollment = findById(enrollmentId);
        if (!enrollment.getStudent().getId().equals(studentId)) {
            throw new UnauthorizedException("Cannot modify this enrollment");
        }
        if (enrollment.getStatus() != EnrollmentStatus.ACTIVE && enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new IllegalStateException("Only active enrollments can be withdrawn");
        }

        enrollment.setStatus(EnrollmentStatus.DROPPED);
        enrollment.setCompletedAt(LocalDateTime.now());
        enrollment.setWithdrawalReason(reason);
        enrollment.setWithdrawalRequestedAt(LocalDateTime.now());
        Enrollment saved = enrollmentRepository.save(enrollment);

        auditLogService.log(studentId, "EnrollmentService", "ENROLLMENT_WITHDRAWN",
            String.format("Student %s requested withdrawal from course %s", enrollment.getStudent().getUsername(), enrollment.getCourse().getCode()));

        return saved;
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
                return to == EnrollmentStatus.COMPLETED || to == EnrollmentStatus.DROPPED;
            case COMPLETED:
                return false;
            case REJECTED:
                return to == EnrollmentStatus.PENDING;
            case DROPPED:
                return to == EnrollmentStatus.PENDING;
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
        if (!enrollmentWindowService.isEnrollmentAllowedForStudents()) {
            return Page.empty(pageable);
        }
        return enrollmentRepository.findByStatus(EnrollmentStatus.ACTIVE, pageable);
    }

    /**
     * Get unavailable enrollments - courses with closed enrollment or archived.
     * This is a placeholder implementation.
     */
    public Page<Enrollment> getUnavailableEnrollments(Pageable pageable) {
        if (enrollmentWindowService.isEnrollmentAllowedForStudents()) {
            return Page.empty(pageable);
        }
        return enrollmentRepository.findAll(pageable);
    }
}
