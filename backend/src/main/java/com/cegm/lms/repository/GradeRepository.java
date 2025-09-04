package com.cegm.lms.repository;

import com.cegm.lms.model.Grade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {
    
    List<Grade> findByStudentId(Long studentId);
    
    List<Grade> findByEnrollmentId(Long enrollmentId);
    
    Page<Grade> findByStudentId(Long studentId, Pageable pageable);
    
    Page<Grade> findByEnrollmentId(Long enrollmentId, Pageable pageable);
    
    Optional<Grade> findByEnrollmentIdAndAssignmentName(Long enrollmentId, String assignmentName);
    
    boolean existsByEnrollmentIdAndAssignmentName(Long enrollmentId, String assignmentName);
    
    @Query("SELECT g FROM Grade g WHERE g.student.id = :studentId AND g.enrollment.course.id = :courseId")
    List<Grade> findByStudentIdAndCourseId(@Param("studentId") Long studentId, @Param("courseId") Long courseId);
    
    @Query("SELECT AVG(g.score) FROM Grade g WHERE g.enrollment.id = :enrollmentId")
    Double findAverageScoreByEnrollmentId(@Param("enrollmentId") Long enrollmentId);
}
