package com.cegm.lms.config;

import com.cegm.lms.model.User;
import com.cegm.lms.model.enums.UserRole;
import com.cegm.lms.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import java.util.Optional;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

@Component
public class DefaultUserInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DefaultUserInitializer.class);

    @Autowired
    private Environment environment;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create default dev users only if the database is empty AND their password env var is set
        if (userRepository.count() == 0) {
            Optional<String> adminPw = SeedPasswords.resolve(environment, SeedPasswords.ADMIN_VAR, "admin", log);
            Optional<String> studentPw = SeedPasswords.resolve(environment, SeedPasswords.STUDENT_VAR, "student", log);

            if (adminPw.isPresent()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@cegm.edu");
                admin.setPassword(passwordEncoder.encode(adminPw.get()));
                admin.setFirstName("Admin");
                admin.setLastName("User");
                admin.setRole(UserRole.ADMIN);
                admin.setApproved(true);
                admin.setActive(true);
                admin.setCorrelationId(UUID.randomUUID().toString());
                userRepository.save(admin);
                log.info("Created seeded user: admin");
            }

            if (studentPw.isPresent()) {
                User student = new User();
                student.setUsername("student");
                student.setEmail("student@cegm.edu");
                student.setPassword(passwordEncoder.encode(studentPw.get()));
                student.setFirstName("Student");
                student.setLastName("User");
                student.setRole(UserRole.STUDENT);
                student.setApproved(true);
                student.setActive(true);
                student.setCorrelationId(UUID.randomUUID().toString());
                userRepository.save(student);
                log.info("Created seeded user: student");
            }
        }
    }
}
