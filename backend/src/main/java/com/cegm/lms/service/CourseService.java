package com.cegm.lms.service;

import com.cegm.lms.dto.request.CourseCreateRequest;
import com.cegm.lms.dto.response.AuditResponse;
import com.cegm.lms.dto.response.CourseResponse;
import com.cegm.lms.exception.CourseNotFoundException;
import com.cegm.lms.exception.InvalidTransitionException;
import com.cegm.lms.model.AuditLog;
import com.cegm.lms.model.Course;
import com.cegm.lms.model.enums.CourseStatus;
import com.cegm.lms.repository.AuditLogRepository;
import com.cegm.lms.repository.CourseRepository;
import com.cegm.lms.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    public Course createCourse(CourseCreateRequest request) {
        if (courseRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Course code already exists");
        }

        Course course = new Course();
        course.setCode(request.getCode());
        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setCredits(request.getCredits());
        course.setStatus(CourseStatus.ACTIVE);

        Course savedCourse = courseRepository.save(course);
        auditLogService.log(null, "CourseService", "COURSE_CREATED", 
                          "Course created: " + savedCourse.getCode());

        return savedCourse;
    }

    public Course updateCourse(Long courseId, CourseCreateRequest request) {
        Course course = findById(courseId);
        
        // Check if new code conflicts with existing courses
        if (!course.getCode().equals(request.getCode()) && 
            courseRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Course code already exists");
        }

        course.setCode(request.getCode());
        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setCredits(request.getCredits());

        Course updatedCourse = courseRepository.save(course);
        auditLogService.log(null, "CourseService", "COURSE_UPDATED", 
                          "Course updated: " + updatedCourse.getCode());

        return updatedCourse;
    }

    public Course archiveCourse(Long courseId) {
        Course course = findById(courseId);
        course.setStatus(CourseStatus.INACTIVE);
        
        Course inactiveCourse = courseRepository.save(course);
        auditLogService.log(null, "CourseService", "COURSE_INACTIVATED", 
                          "Course inactivated: " + inactiveCourse.getCode());

        return inactiveCourse;
    }

    public Course findById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new CourseNotFoundException("Course not found"));
    }

    public Course findByCode(String code) {
        return courseRepository.findByCode(code)
                .orElseThrow(() -> new CourseNotFoundException("Course not found"));
    }

    public List<Course> findActiveCourses() {
        return courseRepository.findByStatus(CourseStatus.ACTIVE);
    }

    public Page<Course> findActiveCourses(Pageable pageable) {
        return courseRepository.findByStatus(CourseStatus.ACTIVE, pageable);
    }

    public Page<Course> findAllCourses(Pageable pageable) {
        return courseRepository.findAll(pageable);
    }

    public List<Course> searchCoursesByName(String name) {
        return courseRepository.findByStatusAndNameContainingIgnoreCase(CourseStatus.ACTIVE, name);
    }

    public List<CourseResponse> findCoursesWithFilters(String q, String status, String term, 
                                                      Long ownerId, Boolean assignable, 
                                                      int size, Long after) {
        List<Course> courses = courseRepository.findAll(); // Base query
        
        // Apply filters
        if (status != null) {
            try {
                CourseStatus courseStatus = CourseStatus.valueOf(status.toUpperCase());
                courses = courses.stream()
                    .filter(course -> course.getStatus() == courseStatus)
                    .collect(Collectors.toList());
            } catch (IllegalArgumentException e) {
                // Invalid status, return empty list
                return List.of();
            }
        }
        
        if (term != null) {
            courses = courses.stream()
                .filter(course -> term.equals(course.getTerm()))
                .collect(Collectors.toList());
        }
        
        if (ownerId != null) {
            courses = courses.stream()
                .filter(course -> ownerId.equals(course.getOwnerId()))
                .collect(Collectors.toList());
        }
        
        if (q != null && !q.trim().isEmpty()) {
            String query = q.toLowerCase();
            courses = courses.stream()
                .filter(course -> course.getName().toLowerCase().contains(query) ||
                                course.getCode().toLowerCase().contains(query))
                .collect(Collectors.toList());
        }
        
        if (assignable != null && assignable) {
            // For assignable courses, return courses that are ACTIVE and not yet assigned for upcoming term
            courses = courses.stream()
                .filter(course -> course.getStatus() == CourseStatus.ACTIVE)
                .filter(course -> course.getOwnerId() == null) // Not yet assigned
                .collect(Collectors.toList());
        }
        
        // Apply pagination with 'after' cursor
        if (after != null) {
            courses = courses.stream()
                .filter(course -> course.getId() > after)
                .collect(Collectors.toList());
        }
        
        // Limit results
        if (size > 0 && courses.size() > size) {
            courses = courses.subList(0, size);
        }
        
        // Convert to DTOs
        return courses.stream()
            .map(this::convertToCourseResponse)
            .collect(Collectors.toList());
    }
    
    private CourseResponse convertToCourseResponse(Course course) {
        return new CourseResponse(
            course.getId(),
            course.getCode(),
            course.getName(),
            course.getCredits(),
            course.getStatus(),
            course.getTerm(),
            course.getCreatedAt(),
            course.getOwnerId()
        );
    }

    public List<AuditResponse> getCourseAuditHistory(Long courseId) {
        // Verify course exists
        findById(courseId);
        
        // Find audit logs related to this course
        List<AuditLog> auditLogs = auditLogRepository.findByDetailsContainingOrderByTimestampDesc("Course ID: " + courseId);
        
        return auditLogs.stream()
            .map(this::convertToAuditResponse)
            .collect(Collectors.toList());
    }
    
    public CourseResponse updateCourseStatus(Long courseId, String statusString) {
        Course course = findById(courseId);
        
        CourseStatus newStatus;
        try {
            newStatus = CourseStatus.valueOf(statusString.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + statusString);
        }
        
        CourseStatus oldStatus = course.getStatus();
        
        // Validate transition
        if (!isValidStatusTransition(oldStatus, newStatus)) {
            throw new InvalidTransitionException("That status change isn't allowed.");
        }
        
        course.setStatus(newStatus);
        Course updatedCourse = courseRepository.save(course);
        
        // Log the status change
        auditLogService.log(null, "CourseService", "STATUS_CHANGE", 
                           String.format("Course %s status changed from %s to %s", 
                                       course.getCode(), oldStatus, newStatus));
        
        return convertToCourseResponse(updatedCourse);
    }
    
    private boolean isValidStatusTransition(CourseStatus from, CourseStatus to) {
        if (from == to) return true;
        
        // Allow ACTIVE ↔ CLOSED transitions
        if ((from == CourseStatus.ACTIVE && to == CourseStatus.CLOSED) ||
            (from == CourseStatus.CLOSED && to == CourseStatus.ACTIVE)) {
            return true;
        }
        
        // Allow transitions to INACTIVE from any state
        if (to == CourseStatus.INACTIVE) {
            return true;
        }
        
        // Allow INACTIVE to ACTIVE
        if (from == CourseStatus.INACTIVE && to == CourseStatus.ACTIVE) {
            return true;
        }
        
        return false;
    }
    
    private AuditResponse convertToAuditResponse(AuditLog auditLog) {
        return new AuditResponse(
            auditLog.getTimestamp(),
            auditLog.getServiceName(),
            auditLog.getAction(),
            null, // from - could be extracted from details if needed
            null, // to - could be extracted from details if needed
            auditLog.getDetails()
        );
    }
}
