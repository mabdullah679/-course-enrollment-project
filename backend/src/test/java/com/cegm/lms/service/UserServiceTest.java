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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

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
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.STUDENT);
        testUser.setApproved(true);
        testUser.setActive(true);
    }

    @Test
    void changeUserRole_Success() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.changeUserRole(1L, UserRole.INSTRUCTOR);

        // Then
        assertEquals(UserRole.INSTRUCTOR, result.getRole());
        verify(auditLogService).log(eq(1L), eq("UsersController"), eq("ROLE_CHANGE"), 
                                   contains("STUDENT to INSTRUCTOR"));
        verify(userRepository).save(testUser);
    }

    @Test
    void changeUserRole_WithRequestId() {
        // Given
        String requestId = "req_12345";
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.changeUserRole(1L, UserRole.ADMIN, requestId);

        // Then
        assertEquals(UserRole.ADMIN, result.getRole());
        verify(auditLogService).log(eq(1L), eq("UsersController"), eq("ROLE_CHANGE"), 
                                   argThat(message -> message.contains("STUDENT to ADMIN") && message.contains(requestId)));
    }

    @Test
    void changeUserStatus_ApprovedOnly() {
        // Given
        testUser.setApproved(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.changeUserStatus(1L, true, null);

        // Then
        assertTrue(result.getApproved());
        verify(auditLogService).log(eq(1L), eq("UsersController"), eq("STATUS_CHANGE"), 
                                   contains("Approved status changed from false to true"));
        verify(userRepository).save(testUser);
    }

    @Test
    void changeUserStatus_ActiveOnly() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.changeUserStatus(1L, null, false);

        // Then
        assertFalse(result.getActive());
        verify(auditLogService).log(eq(1L), eq("UsersController"), eq("STATUS_CHANGE"), 
                                   contains("Active status changed from true to false"));
    }

    @Test
    void changeUserStatus_BothFields() {
        // Given
        testUser.setApproved(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.changeUserStatus(1L, true, false, "req_67890");

        // Then
        assertTrue(result.getApproved());
        assertFalse(result.getActive());
        verify(auditLogService, times(2)).log(eq(1L), eq("UsersController"), eq("STATUS_CHANGE"), anyString());
    }
}