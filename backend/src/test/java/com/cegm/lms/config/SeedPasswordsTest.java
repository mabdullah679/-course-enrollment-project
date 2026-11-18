package com.cegm.lms.config;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.cegm.lms.model.User;
import com.cegm.lms.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Seeded dev passwords must come from SEED_ADMIN_PASSWORD / SEED_STUDENT_PASSWORD, never from code. */
class SeedPasswordsTest {

    private static final String ADMIN_VAR = "SEED_ADMIN_PASSWORD";
    private static final String STUDENT_VAR = "SEED_STUDENT_PASSWORD";

    private UserRepository repo;
    private PasswordEncoder encoder;
    private MockEnvironment env;
    private ListAppender<ILoggingEvent> logs;
    private final Logger[] watched = {
            (Logger) LoggerFactory.getLogger(DefaultUserInitializer.class),
            (Logger) LoggerFactory.getLogger(DataSeeder.class)};

    @BeforeEach
    void setUp() {
        repo = mock(UserRepository.class);
        when(repo.count()).thenReturn(0L);
        when(repo.findByEmail(any())).thenReturn(Optional.empty());
        encoder = mock(PasswordEncoder.class);
        when(encoder.encode(any())).thenAnswer(i -> "ENC(" + i.getArgument(0) + ")");
        env = new MockEnvironment();
        logs = new ListAppender<>();
        logs.start();
        for (Logger l : watched) l.addAppender(logs);
    }

    @AfterEach
    void tearDown() {
        for (Logger l : watched) l.detachAppender(logs);
    }

    private DefaultUserInitializer initializer() {
        DefaultUserInitializer s = new DefaultUserInitializer();
        ReflectionTestUtils.setField(s, "userRepository", repo);
        ReflectionTestUtils.setField(s, "passwordEncoder", encoder);
        ReflectionTestUtils.setField(s, "environment", env);
        return s;
    }

    private DataSeeder dataSeeder() {
        DataSeeder s = new DataSeeder();
        ReflectionTestUtils.setField(s, "userRepository", repo);
        ReflectionTestUtils.setField(s, "passwordEncoder", encoder);
        ReflectionTestUtils.setField(s, "environment", env);
        return s;
    }

    private List<User> saved() {
        var cap = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(repo, atLeast(0)).save(cap.capture());
        return cap.getAllValues();
    }

    private boolean warnedAbout(String var) {
        return logs.list.stream().anyMatch(e -> e.getLevel() == Level.WARN
                && e.getFormattedMessage().contains(var));
    }

    // ---- DefaultUserInitializer
    @Test
    void initializer_createsAdminOnlyWhenAdminVarSet() throws Exception {
        env.setProperty(ADMIN_VAR, "pw-from-env-A");
        initializer().run();
        List<User> users = saved();
        assertEquals(1, users.size());
        assertEquals("admin", users.get(0).getUsername());
        verify(encoder).encode("pw-from-env-A");
        assertTrue(warnedAbout(STUDENT_VAR), "student var unset must warn");
        assertFalse(warnedAbout(ADMIN_VAR));
    }

    @Test
    void initializer_createsNoUsersAndWarnsWhenUnset() throws Exception {
        initializer().run();
        assertTrue(saved().isEmpty());
        assertTrue(warnedAbout(ADMIN_VAR));
        assertTrue(warnedAbout(STUDENT_VAR));
    }

    @Test
    void initializer_blankValueCountsAsUnset() throws Exception {
        env.setProperty(ADMIN_VAR, "   ");
        initializer().run();
        assertTrue(saved().isEmpty());
        assertTrue(warnedAbout(ADMIN_VAR));
    }

    @Test
    void initializer_createsStudentWhenStudentVarSet() throws Exception {
        env.setProperty(STUDENT_VAR, "pw-from-env-S");
        initializer().run();
        List<User> users = saved();
        assertEquals(1, users.size());
        assertEquals("student", users.get(0).getUsername());
    }

    @Test
    void warningsNeverContainThePasswordValue() throws Exception {
        env.setProperty(ADMIN_VAR, "SECRET-VALUE-XYZ");
        initializer().run();
        assertTrue(logs.list.stream().noneMatch(e -> e.getFormattedMessage().contains("SECRET-VALUE-XYZ")));
    }

    // ---- DataSeeder.seedUsers
    @Test
    void dataSeeder_adminAndStudentOnlyWhenVarsSet() {
        env.setProperty(ADMIN_VAR, "pw-A");
        ReflectionTestUtils.invokeMethod(dataSeeder(), "seedUsers");
        List<String> emails = saved().stream().map(User::getEmail).toList();
        assertTrue(emails.contains("admin@cegm.edu"));
        assertFalse(emails.contains("student@cegm.edu"));
        assertTrue(warnedAbout(STUDENT_VAR));
    }

    @Test
    void dataSeeder_noAdminNoStudentAndWarnsWhenUnset() {
        ReflectionTestUtils.invokeMethod(dataSeeder(), "seedUsers");
        List<String> emails = saved().stream().map(User::getEmail).toList();
        assertFalse(emails.contains("admin@cegm.edu"));
        assertFalse(emails.contains("student@cegm.edu"));
        assertTrue(warnedAbout(ADMIN_VAR));
        assertTrue(warnedAbout(STUDENT_VAR));
    }

    // ---- no literal in source
    @Test
    void noPasswordLiteralInSeederSources() throws Exception {
        for (String f : List.of("DefaultUserInitializer.java", "DataSeeder.java")) {
            String src = Files.readString(Path.of("src/main/java/com/cegm/lms/config", f));
            // literals built in pieces so this file itself never contains the old values
            for (String old : List.of("admin" + "123", "student" + "123")) {
                assertFalse(src.contains(old), f + " contains a hard-coded seed password");
            }
        }
    }
}
