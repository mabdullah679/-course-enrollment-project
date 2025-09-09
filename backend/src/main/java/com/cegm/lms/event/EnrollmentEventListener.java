package com.cegm.lms.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Minimal event listener for enrollment rejection events.
 * This is a scaffold for future notification implementations.
 */
@Component
public class EnrollmentEventListener {
    private static final Logger logger = LoggerFactory.getLogger(EnrollmentEventListener.class);

    @EventListener
    public void handleEnrollmentRejected(EnrollmentRejectedEvent event) {
        // Log the event for now - this is where notification logic would go
        logger.info("Enrollment rejected: enrollmentId={}, studentId={}, courseId={}, courseName={}, studentName={}", 
            event.getEnrollmentId(), 
            event.getStudentId(), 
            event.getCourseId(), 
            event.getCourseName(), 
            event.getStudentName()
        );
        
        // TODO: Future implementation would:
        // 1. Send email to student
        // 2. Add in-app notification to student dashboard
        // 3. Update instructor dashboard with rejection confirmation
    }
}