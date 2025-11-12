package com.cegm.lms.service;

import com.cegm.lms.model.AuditLog;
import com.cegm.lms.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public AuditLog log(Long userId, String serviceName, String action, String details) {
        AuditLog auditLog = new AuditLog(userId, serviceName, action, details);
        if (userId != null) {
            auditLog.setUserId(userId);
        }
        return auditLogRepository.save(auditLog);
    }

    public AuditLog logError(Long userId, String serviceName, String errorCode, String details) {
        AuditLog auditLog = new AuditLog(userId, serviceName, "ERROR", details);
        if (userId != null) {
            auditLog.setUserId(userId);
        }
        auditLog.setErrorCode(errorCode);
        return auditLogRepository.save(auditLog);
    }

    public AuditLog logWithCorrelation(Long userId, String serviceName, String action, String details, String correlationId) {
        AuditLog auditLog = new AuditLog(userId, serviceName, action, details);
        auditLog.setCorrelationId(correlationId);
        return auditLogRepository.save(auditLog);
    }

    public List<AuditLog> getLogsByUserId(Long userId) {
        return auditLogRepository.findByUserId(userId);
    }

    public Page<AuditLog> getLogsByUserId(Long userId, Pageable pageable) {
        return auditLogRepository.findByUserId(userId, pageable);
    }

    public Page<AuditLog> getLogsByCourseId(Long courseId, Pageable pageable) {
        return auditLogRepository.findByCourseId(courseId, pageable);
    }

    public List<AuditLog> getLogsByServiceName(String serviceName) {
        return auditLogRepository.findByServiceName(serviceName);
    }

    public List<AuditLog> getLogsByCorrelationId(String correlationId) {
        return auditLogRepository.findByCorrelationId(correlationId);
    }

    public List<AuditLog> getLogsBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return auditLogRepository.findByTimestampBetween(startDate, endDate);
    }

    public List<AuditLog> getErrorLogs() {
        return auditLogRepository.findErrorLogs();
    }

    public List<AuditLog> getErrorLogsByUserId(Long userId) {
        return auditLogRepository.findErrorLogsByUserId(userId);
    }

    public AuditLog logCourse(Long courseId, Long userId, String action, String details) {
        AuditLog auditLog = new AuditLog(userId, "CourseService", action, details);
        auditLog.setCourseId(courseId);
        return auditLogRepository.save(auditLog);
    }
}