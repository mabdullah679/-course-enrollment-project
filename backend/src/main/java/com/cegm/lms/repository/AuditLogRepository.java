package com.cegm.lms.repository;

import com.cegm.lms.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    List<AuditLog> findByUserId(Long userId);
    
    List<AuditLog> findByServiceName(String serviceName);
    
    List<AuditLog> findByCorrelationId(String correlationId);
    
    Page<AuditLog> findByUserId(Long userId, Pageable pageable);
    
    Page<AuditLog> findByServiceName(String serviceName, Pageable pageable);
    
    @Query("SELECT a FROM AuditLog a WHERE a.timestamp BETWEEN :startDate AND :endDate")
    List<AuditLog> findByTimestampBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT a FROM AuditLog a WHERE a.errorCode IS NOT NULL")
    List<AuditLog> findErrorLogs();
    
    @Query("SELECT a FROM AuditLog a WHERE a.userId = :userId AND a.errorCode IS NOT NULL")
    List<AuditLog> findErrorLogsByUserId(@Param("userId") Long userId);
}
