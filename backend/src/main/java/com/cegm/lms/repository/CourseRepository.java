package com.cegm.lms.repository;

import com.cegm.lms.model.Course;
import com.cegm.lms.model.enums.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    Optional<Course> findByCode(String code);
    
    boolean existsByCode(String code);
    
    List<Course> findByStatus(CourseStatus status);
    
    Page<Course> findByStatus(CourseStatus status, Pageable pageable);
    
    Page<Course> findByStatusNot(CourseStatus status, Pageable pageable);
    
    List<Course> findByStatusAndNameContainingIgnoreCase(CourseStatus status, String name);
}
