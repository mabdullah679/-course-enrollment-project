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

import com.cegm.lms.model.AuditLog;

import java.util.List;
import java.util.Map;
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
        verify(auditLogService).logWithCorrelation(eq(1L), eq("UsersController"), eq("ROLE_CHANGE"), 
                                   contains("STUDENT to ADMIN"), eq(requestId));
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
        // Verify that both audit logs are called with correlation ID
        verify(auditLogService).logWithCorrelation(eq(1L), eq("UsersController"), eq("STATUS_CHANGE"), 
                                                   contains("Approved status changed from false to true"), eq("req_67890"));
        verify(auditLogService).logWithCorrelation(eq(1L), eq("UsersController"), eq("STATUS_CHANGE"), 
                                                   contains("Active status changed from true to false"), eq("req_67890"));
    }

    private AuditLog audit(long id) {
        AuditLog a = new AuditLog();
        a.setId(id);
        return a;
    }

    @Test
    @SuppressWarnings("unchecked")
    void getUserAuditHistory_paginatesNewestFirstWithKeysetCursor() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(auditLogService.getLogsByUserId(1L)).thenReturn(List.of(audit(1), audit(2), audit(3), audit(4), audit(5)));

        Map<String, Object> first = (Map<String, Object>) userService.getUserAuditHistory(1L, null, 2);
        assertEquals(List.of(5L, 4L), ((List<AuditLog>) first.get("data")).stream().map(AuditLog::getId).toList());
        assertEquals(true, first.get("hasNext"));
        assertEquals("4", first.get("cursor"));

        Map<String, Object> last = (Map<String, Object>) userService.getUserAuditHistory(1L, "2", 2);
        assertEquals(List.of(1L), ((List<AuditLog>) last.get("data")).stream().map(AuditLog::getId).toList());
        assertEquals(false, last.get("hasNext"));
        assertEquals("", last.get("cursor"));
    }

    @Test
    void getUserAuditHistory_rejectsNonNumericCursor() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        assertThrows(IllegalArgumentException.class, () -> userService.getUserAuditHistory(1L, "abc", 5));
    }
}
