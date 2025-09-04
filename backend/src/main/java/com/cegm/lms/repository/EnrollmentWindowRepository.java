package com.cegm.lms.repository;

import com.cegm.lms.model.EnrollmentWindow;
import com.cegm.lms.model.enums.EnrollmentWindowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EnrollmentWindowRepository extends JpaRepository<EnrollmentWindow, Long> {
    
    @Query("SELECT e FROM EnrollmentWindow e ORDER BY e.updatedAt DESC LIMIT 1")
    Optional<EnrollmentWindow> findLatest();
    
    Optional<EnrollmentWindow> findTopByOrderByUpdatedAtDesc();
    
    Optional<EnrollmentWindow> findByStatus(EnrollmentWindowStatus status);
}
