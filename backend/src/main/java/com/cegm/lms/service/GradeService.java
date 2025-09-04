package com.cegm.lms.service;

import com.cegm.lms.exception.EnrollmentNotFoundException;
import com.cegm.lms.exception.GradeNotFoundException;
import com.cegm.lms.model.Enrollment;
import com.cegm.lms.model.Grade;
import com.cegm.lms.repository.EnrollmentRepository;
import com.cegm.lms.repository.GradeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Service for managing grades with SSoT compliance.
 * Implements grade domain rules and instructor permissions.
 */
@Service
@Transactional
public class GradeService {

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Create new grade assignment.
     */
    public Grade createGrade(Long enrollmentId, String assignmentName, Double score, String feedback) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
            .orElseThrow(() -> new EnrollmentNotFoundException("Enrollment not found"));

        // Check for duplicate assignment
        if (gradeRepository.existsByEnrollmentIdAndAssignmentName(enrollmentId, assignmentName)) {
            throw new IllegalStateException("Grade already exists for this assignment");
        }

        Grade grade = new Grade();
        grade.setEnrollment(enrollment);
        grade.setStudent(enrollment.getStudent());
        grade.setAssignmentName(assignmentName);
        
        if (score != null) {
            // Apply SSoT rounding rule: standard half up to one decimal if needed
            BigDecimal roundedScore = BigDecimal.valueOf(score)
                .setScale(1, RoundingMode.HALF_UP);
            grade.setScore(roundedScore);
        }
        
        if (feedback != null) {
            grade.setFeedback(feedback);
        }

        Grade savedGrade = gradeRepository.save(grade);
        
        auditLogService.log(enrollment.getStudent().getId(), "GradeService", "GRADE_CREATED",
            String.format("Grade created for assignment %s", assignmentName));
        
        return savedGrade;
    }

    /**
     * Update existing grade.
     */
    public Grade updateGrade(Long gradeId, Double score, String feedback) {
        Grade grade = findById(gradeId);
        
        if (score != null) {
            // Apply SSoT rounding rule: standard half up to one decimal if needed
            BigDecimal roundedScore = BigDecimal.valueOf(score)
                .setScale(1, RoundingMode.HALF_UP);
            grade.setScore(roundedScore);
        }
        
        if (feedback != null) {
            grade.setFeedback(feedback);
        }

        Grade updatedGrade = gradeRepository.save(grade);
        
        auditLogService.log(grade.getStudent().getId(), "GradeService", "GRADE_UPDATED",
            String.format("Grade updated for assignment %s", grade.getAssignmentName()));
        
        return updatedGrade;
    }

    /**
     * Check if grade belongs to a student (for authorization).
     */
    public boolean isStudentGrade(Long gradeId, Long studentId) {
        return gradeRepository.findById(gradeId)
            .map(grade -> grade.getStudent().getId().equals(studentId))
            .orElse(false);
    }

    /**
     * Check if grade belongs to an instructor's course (for authorization).
     * This is a placeholder - would need instructor-course mapping.
     */
    public boolean isInstructorGrade(Long gradeId, Long instructorId) {
        // TODO: Implement instructor-course relationship check
        // For now, return true for any instructor
        return true;
    }

    // Finder methods
    public Grade findById(Long id) {
        return gradeRepository.findById(id)
            .orElseThrow(() -> new GradeNotFoundException("Grade not found"));
    }

    public Page<Grade> getAllGrades(Pageable pageable) {
        return gradeRepository.findAll(pageable);
    }

    public Page<Grade> getGradesByStudent(Long studentId, Pageable pageable) {
        return gradeRepository.findByStudentId(studentId, pageable);
    }

    public Page<Grade> getGradesByCourse(Long courseId, Pageable pageable) {
        // Use enrollment-based query to get grades by course
        return gradeRepository.findAll(pageable); // TODO: Implement proper course-based query
    }

    public Page<Grade> getGradesByCourseAndStudent(Long courseId, Long studentId, Pageable pageable) {
        // TODO: Implement proper course + student filtering
        return gradeRepository.findByStudentId(studentId, pageable);
    }
}
