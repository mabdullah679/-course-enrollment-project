package com.cegm.lms.config;

import com.cegm.lms.model.User;
import com.cegm.lms.model.Course;
import com.cegm.lms.model.enums.UserRole;
import com.cegm.lms.model.enums.CourseStatus;
import com.cegm.lms.repository.UserRepository;
import com.cegm.lms.repository.CourseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        logger.info("Starting data seeding...");
        
        try {
            seedUsers();
            seedCourses();
            logger.info("Data seeding completed successfully");
        } catch (Exception e) {
            logger.error("Data seeding failed", e);
            throw e; // Fail fast as per guardrails
        }
    }
    
    private void seedUsers() {
        // Check if admin already exists
        if (userRepository.findByEmail("admin@cegm.edu").isPresent()) {
            logger.info("Admin user already exists, skipping user seeding");
            return;
        }
        
        logger.info("Seeding default users...");
        
        // Create default admin user
        User adminUser = new User();
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@cegm.edu");
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setPassword(passwordEncoder.encode("admin123"));
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setApproved(true);
        adminUser.setActive(true);
        adminUser.setCreatedAt(LocalDateTime.now());
        
        userRepository.save(adminUser);
        logger.info("Created admin user: admin@cegm.edu");
        
        // Create sample instructor
        User instructorUser = new User();
        instructorUser.setUsername("instructor1");
        instructorUser.setEmail("instructor@cegm.edu");
        instructorUser.setFirstName("John");
        instructorUser.setLastName("Instructor");
        instructorUser.setPassword(passwordEncoder.encode("instructor123"));
        instructorUser.setRole(UserRole.INSTRUCTOR);
        instructorUser.setApproved(true);
        instructorUser.setActive(true);
        instructorUser.setCreatedAt(LocalDateTime.now());
        
        userRepository.save(instructorUser);
        logger.info("Created instructor user: instructor@cegm.edu");
        
        // Create sample staff
        User staffUser = new User();
        staffUser.setUsername("staff1");
        staffUser.setEmail("staff@cegm.edu");
        staffUser.setFirstName("Jane");
        staffUser.setLastName("Staff");
        staffUser.setPassword(passwordEncoder.encode("staff123"));
        staffUser.setRole(UserRole.STAFF);
        staffUser.setApproved(true);
        staffUser.setActive(true);
        staffUser.setCreatedAt(LocalDateTime.now());
        
        userRepository.save(staffUser);
        logger.info("Created staff user: staff@cegm.edu");
        
        // Create sample student (pending approval)
        User studentUser = new User();
        studentUser.setUsername("student1");
        studentUser.setEmail("student@cegm.edu");
        studentUser.setFirstName("Bob");
        studentUser.setLastName("Student");
        studentUser.setPassword(passwordEncoder.encode("student123"));
        studentUser.setRole(UserRole.STUDENT);
        studentUser.setApproved(false); // Pending approval
        studentUser.setActive(true);
        studentUser.setCreatedAt(LocalDateTime.now());
        
        userRepository.save(studentUser);
        logger.info("Created pending student user: student@cegm.edu");
    }
    
    private void seedCourses() {
        // Check if courses already exist
        if (courseRepository.count() > 0) {
            logger.info("Courses already exist, skipping course seeding");
            return;
        }
        
        logger.info("Seeding sample courses...");
        
        // Create sample courses
        Course course1 = new Course();
        course1.setCode("CS101");
        course1.setName("Introduction to Computer Science");
        course1.setDescription("Fundamental concepts of computer science including programming, data structures, and algorithms.");
        course1.setCredits(3);
        course1.setStatus(CourseStatus.ACTIVE);
        course1.setCreatedAt(LocalDateTime.now());
        
        courseRepository.save(course1);
        logger.info("Created course: CS101");
        
        Course course2 = new Course();
        course2.setCode("MATH201");
        course2.setName("Calculus II");
        course2.setDescription("Advanced calculus topics including integration techniques and series.");
        course2.setCredits(4);
        course2.setStatus(CourseStatus.ACTIVE);
        course2.setCreatedAt(LocalDateTime.now());
        
        courseRepository.save(course2);
        logger.info("Created course: MATH201");
        
        Course course3 = new Course();
        course3.setCode("ENG301");
        course3.setName("Technical Writing");
        course3.setDescription("Professional writing skills for technical documentation and communication.");
        course3.setCredits(3);
        course3.setStatus(CourseStatus.ACTIVE);
        course3.setCreatedAt(LocalDateTime.now());
        
        courseRepository.save(course3);
        logger.info("Created course: ENG301");
    }
}