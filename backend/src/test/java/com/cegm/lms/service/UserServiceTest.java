package com.cegm.lms.service;

import com.cegm.lms.model.User;
import com.cegm.lms.model.enums.UserRole;
import com.cegm.lms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setUsername("testuser");
        testUser.setRole(UserRole.STUDENT);
        testUser.setApproved(false);
        testUser.setActive(true);
    }

    @Test
    void testChangeUserRole() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.changeUserRole(1L, UserRole.INSTRUCTOR);

        // Then
        assertEquals(UserRole.INSTRUCTOR, result.getRole());
        verify(auditLogService).log(eq(1L), eq("UsersController"), eq("ROLE_CHANGE"), 
            contains("Role changed from STUDENT to INSTRUCTOR"));
        verify(userRepository).save(testUser);
    }

    @Test
    void testUpdateApprovalStatus() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.updateApprovalStatus(1L, true);

        // Then
        assertTrue(result.getApproved());
        verify(auditLogService).log(eq(1L), eq("UsersController"), eq("APPROVAL_STATUS_CHANGE"), 
            contains("Approval status changed from false to true"));
        verify(userRepository).save(testUser);
    }

    @Test
    void testUpdateActiveStatus() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.updateActiveStatus(1L, false);

        // Then
        assertFalse(result.getActive());
        verify(auditLogService).log(eq(1L), eq("UsersController"), eq("ACTIVE_STATUS_CHANGE"), 
            contains("Active status changed from true to false"));
        verify(userRepository).save(testUser);
    }
}