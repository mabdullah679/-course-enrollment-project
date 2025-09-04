package com.cegm.lms.service;

import com.cegm.lms.dto.request.CourseCreateRequest;
import com.cegm.lms.exception.CourseNotFoundException;
import com.cegm.lms.model.Course;
import com.cegm.lms.model.enums.CourseStatus;
import com.cegm.lms.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private AuditLogService auditLogService;

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
        course.setStatus(CourseStatus.ARCHIVED);
        
        Course archivedCourse = courseRepository.save(course);
        auditLogService.log(null, "CourseService", "COURSE_ARCHIVED", 
                          "Course archived: " + archivedCourse.getCode());

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
}
