package com.cegm.lms.service;

import com.cegm.lms.dto.request.CourseCreateRequest;
import com.cegm.lms.exception.CourseNotFoundException;
import com.cegm.lms.model.AuditLog;
import com.cegm.lms.model.Course;
import com.cegm.lms.model.Enrollment;
import com.cegm.lms.model.enums.CourseStatus;
import com.cegm.lms.model.enums.EnrollmentStatus;
import com.cegm.lms.repository.CourseRepository;
import com.cegm.lms.repository.EnrollmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CourseService {
    private static final Logger log = LoggerFactory.getLogger(CourseService.class);

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

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
        log.info("Course created: {}", savedCourse.getCode());
        auditLogService.logCourse(savedCourse.getId(), null, "COURSE_CREATED",
                String.format("Course %s (%s) created", savedCourse.getName(), savedCourse.getCode()));

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
        log.info("Course updated: {}", updatedCourse.getCode());
        auditLogService.logCourse(updatedCourse.getId(), null, "COURSE_UPDATED",
                String.format("Course %s updated", updatedCourse.getCode()));

        return updatedCourse;
    }

    public Course archiveCourse(Long courseId) {
        Course course = findById(courseId);
        course.setStatus(CourseStatus.ARCHIVED);
        
        Course archivedCourse = courseRepository.save(course);
        log.info("Course archived: {}", archivedCourse.getCode());
        auditLogService.logCourse(archivedCourse.getId(), null, "COURSE_ARCHIVED",
                String.format("Course %s archived", archivedCourse.getCode()));

        return archivedCourse;
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

    public List<Course> findCoursesForStudent(Long studentId) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        return enrollments.stream()
                .filter(enrollment -> enrollment.getStatus() == EnrollmentStatus.APPROVED
                        || enrollment.getStatus() == EnrollmentStatus.ACTIVE
                        || enrollment.getStatus() == EnrollmentStatus.COMPLETED)
                .map(Enrollment::getCourse)
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * Change course status.
     */
    public Course changeCourseStatus(Long courseId, String status, String requestId) {
        Course course = findById(courseId);
        CourseStatus oldStatus = course.getStatus();
        
        CourseStatus newStatus = CourseStatus.valueOf(status);
        course.setStatus(newStatus);
        
        Course savedCourse = courseRepository.save(course);
        
        auditLogService.logWithCorrelation(null, "CourseService", "COURSE_STATUS_CHANGED", 
                          String.format("Course status changed from %s to %s for course: %s", 
                                      oldStatus, newStatus, course.getCode()), requestId);
        auditLogService.logCourse(savedCourse.getId(), null, "COURSE_STATUS_CHANGED",
                String.format("Status changed from %s to %s", oldStatus, newStatus));

        return savedCourse;
    }

    /**
     * Get total courses count.
     */
    public int getCoursesCount() {
        return (int) courseRepository.count();
    }

    public Page<AuditLog> getCourseAuditLogs(Long courseId, Pageable pageable) {
        return auditLogService.getLogsByCourseId(courseId, pageable);
    }
}
