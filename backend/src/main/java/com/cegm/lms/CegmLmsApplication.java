package com.cegm.lms;

import com.cegm.lms.model.User;
import com.cegm.lms.model.enums.UserRole;
import com.cegm.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

@SpringBootApplication
public class CegmLmsApplication implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public static void main(String[] args) {
        SpringApplication.run(CegmLmsApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        // Create default users for testing if database is empty
        if (userRepository.count() == 0) {
            System.out.println("🔄 Initializing default test users...");
            
            // Create admin user
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@cegm.edu");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setRole(UserRole.ADMIN);
            admin.setApproved(true);
            admin.setActive(true);
            admin.setCorrelationId(UUID.randomUUID().toString());
            userRepository.save(admin);

            // Create student user
            User student = new User();
            student.setUsername("student");
            student.setEmail("student@cegm.edu");
            student.setPassword(passwordEncoder.encode("student123"));
            student.setFirstName("Student");
            student.setLastName("User");
            student.setRole(UserRole.STUDENT);
            student.setApproved(true);
            student.setActive(true);
            student.setCorrelationId(UUID.randomUUID().toString());
            userRepository.save(student);

            System.out.println("✅ Default users created:");
            System.out.println("   👨‍💼 Admin: username=admin, password=admin123");
            System.out.println("   👨‍🎓 Student: username=student, password=student123");
        }
    }
}
