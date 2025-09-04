package com.cegm.lms.repository;

import com.cegm.lms.model.Enrollment;
import com.cegm.lms.model.enums.EnrollmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    
    Optional<Enrollment> findByStudentIdAndCourseId(Long studentId, Long courseId);
    
    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);
    
    List<Enrollment> findByStudentId(Long studentId);
    
    List<Enrollment> findByCourseId(Long courseId);
    
    Page<Enrollment> findByStudentId(Long studentId, Pageable pageable);
    
    Page<Enrollment> findByCourseId(Long courseId, Pageable pageable);
    
    List<Enrollment> findByStatus(EnrollmentStatus status);
    
    Page<Enrollment> findByStatus(EnrollmentStatus status, Pageable pageable);
    
    List<Enrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);
    
    List<Enrollment> findByCourseIdAndStatus(Long courseId, EnrollmentStatus status);
    
    @Query("SELECT e FROM Enrollment e WHERE e.student.id = :studentId AND e.status = 'ACTIVE'")
    List<Enrollment> findActiveEnrollmentsByStudentId(@Param("studentId") Long studentId);
    
    @Query("SELECT e FROM Enrollment e WHERE e.course.id = :courseId AND e.status = 'ACTIVE'")
    List<Enrollment> findActiveEnrollmentsByCourseId(@Param("courseId") Long courseId);
}
